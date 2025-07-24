SELECT 
    so.name                                AS `Sales Order`,
    so.custom_order_status                 AS `Type`,
    so.transaction_date                    AS `Sales Order Date`,
    soi.delivery_date                      AS `Required Date`,
    so.currency                            AS `Currency`,
    so.po_no                               AS `Customer PO Number`,
    so.po_date                             AS `Customer PO Date`,
    spi.name                               AS `Sales Person ID`,
    so.customer                            AS `Customer ID`,
    so.customer_name                       AS `Customer Name`,
    soi.custom_customer_part_code          AS `Customer Part Code`,
    soi.custom_customer_description        AS `Customer Description`,
    itm.gst_hsn_code                       AS `HSN Code`,
    itm.custom_store_name                  AS `Store Name`,
    soi.item_code                          AS `Item Code`,
    soi.item_name                          AS `Item Name`,
    soi.uom                                AS `UOM`,
    soi.qty                                AS `Ordered Qty`,
    (soi.qty - IFNULL(delivery_data.delivered_qty, 0)) AS `Pending Qty`,
    soi.rate                               AS `Unit Rate`,
    soi.amount                             AS `Total Amount`,
    (soi.qty - IFNULL(delivery_data.delivered_qty, 0)) * soi.rate AS `Pending Amount`,
    soi.warehouse                          AS `Target Warehouse`,
    bin_summary.`Warehouse Stock`          AS `Warehouse Stock`,
    IFNULL(reorder_summary.total_reorder_level, 0) AS `Reorder Level Qty`,

    CASE
        WHEN cust.custom_locked = 1 THEN 'Locked'
        ELSE ''
    END AS `Customer Lock Status`

FROM 
    `tabSales Order` so
JOIN 
    `tabSales Order Item` soi ON so.name = soi.parent 
        AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")

LEFT JOIN 
    `tabSales Person ID` spi ON so.custom_sales_person_id = spi.name
LEFT JOIN 
    `tabItem` itm ON soi.item_code = itm.item_code
LEFT JOIN 
    `tabCustomer` cust ON cust.name = so.customer

-- Map SOI warehouse to tree structure
LEFT JOIN `tabWarehouse` wh_soi ON soi.warehouse = wh_soi.name

-- Delivered Qty Summary
LEFT JOIN (
    SELECT 
        dni.so_detail,
        SUM(dni.qty) AS delivered_qty
    FROM 
        `tabDelivery Note Item` dni
    JOIN 
        `tabDelivery Note` dn ON dni.parent = dn.name
    WHERE
        dn.docstatus = 1 AND
        dn.is_return != 1
    GROUP BY 
        dni.so_detail
) delivery_data ON delivery_data.so_detail = soi.name

-- Reorder Summary
LEFT JOIN (
    SELECT 
        parent AS item_code,
        SUM(warehouse_reorder_level) AS total_reorder_level
    FROM `tabItem Reorder`
    GROUP BY parent
) AS reorder_summary ON reorder_summary.item_code = itm.item_code

-- ✅ Warehouse Stock Summary (excluding Picking - MVDF group)
LEFT JOIN (
    SELECT 
        b.item_code,
        GROUP_CONCAT(
            CONCAT(b.warehouse, ' (', ROUND(b.actual_qty, 2), ')')
            ORDER BY b.actual_qty DESC
            SEPARATOR ', '
        ) AS `Warehouse Stock`
    FROM 
        `tabBin` b
    JOIN 
        `tabWarehouse` w ON b.warehouse = w.name
    WHERE 
        w.company = %(company)s
        AND b.actual_qty > 0
        AND NOT EXISTS (
            SELECT 1 FROM `tabWarehouse` ex
            WHERE ex.name = 'Picking - MVDF'
              AND w.lft BETWEEN ex.lft AND ex.rgt
        )
    GROUP BY 
        b.item_code
) AS bin_summary ON soi.item_code = bin_summary.item_code

-- ASN Summary (ETA from ASN)
LEFT JOIN (
    SELECT 
        ascc.item,
        MIN(an.estimated_arrival_date) AS estimated_arrival_date
    FROM 
        `tabAdvance Shipment Child` ascc
    JOIN 
        `tabAdvance Shipment Notice` an ON ascc.parent = an.name
    WHERE 
        an.company = %(company)s
        AND ascc.done = 0
    GROUP BY 
        ascc.item
) AS asn_summary ON soi.item_code = asn_summary.item

-- Latest Purchase Order Info
LEFT JOIN (
    SELECT *
    FROM (
        SELECT 
            poi.item_code AS item,
            (poi.qty - IFNULL(poi.received_qty, 0)) AS pending_qty,
            po.creation,
            poi.custom_date,
            ROW_NUMBER() OVER (PARTITION BY poi.item_code ORDER BY po.creation DESC) AS rn
        FROM 
            `tabPurchase Order Item` poi
        JOIN 
            `tabPurchase Order` po ON poi.parent = po.name
        WHERE 
            po.company = %(company)s
            AND po.docstatus = 1
            AND (poi.qty - IFNULL(poi.received_qty, 0)) > 0
    ) latest_po
    WHERE rn = 1
) AS po_summary ON soi.item_code = po_summary.item

-- ✅ WHERE clause
WHERE  
    so.docstatus = 1
    AND so.status NOT IN ('Closed', 'Cancelled', 'Completed')
    AND (so.custom_order_status IS NULL OR so.custom_order_status NOT IN ('NPD', 'Fore Cast'))
    AND so.company = %(company)s
    AND (soi.qty - IFNULL(delivery_data.delivered_qty, 0)) > 0
    
    -- AND NOT EXISTS (
    --     SELECT 1 FROM `tabWarehouse` ex
    --     WHERE ex.name = 'Picking - MVDF'
    --       AND wh_soi.lft BETWEEN ex.lft AND ex.rgt
    -- )

    AND (
        (%(from_date)s IS NULL AND %(to_date)s IS NULL)
        OR (
            (%(from_date)s IS NULL OR so.transaction_date >= %(from_date)s)
            AND (%(to_date)s IS NULL OR so.transaction_date <= %(to_date)s)
        )
    )

ORDER BY 
    `Sales Order Date` ASC;


-- ✅ Exclude SOI with warehouse in Picking - MVDF group