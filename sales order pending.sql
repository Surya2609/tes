SELECT DISTINCT * FROM (
    SELECT 
        so.name                                AS `Sales Order`,
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
        soi.item_code                          AS `Item Code`,
        soi.item_name                          AS `Item Name`,
        soi.uom                                AS `UOM`,
        soi.qty                                AS `Ordered Qty`,
        -- (soi.qty - soi.delivered_qty)          AS `Pending Qty t1`,

        (soi.qty - IFNULL(billed_data.billed_qty, 0)) AS `Pending Qty`,

        soi.rate                               AS `Unit Rate`,
        soi.amount                             AS `Total Amount`,
        (soi.qty - soi.delivered_qty) * soi.rate AS `Pending Amount`,
        soi.warehouse                          AS `Target Warehouse`,
        bin_summary.`Warehouse Stock`          AS `Warehouse Stock`,
        IFNULL(reorder_summary.total_reorder_level, 0) AS `Reorder Level Qty`,

        COALESCE(
            asn_summary.estimated_arrival_date,
            DATE_ADD(po_summary.custom_date, INTERVAL IFNULL(itm.custom_transit_time_in_days, 0) DAY),
            '-- Not Available --'
        ) AS `ETA`,

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


LEFT JOIN (
    SELECT 
        sii.so_detail,
        SUM(sii.qty) AS billed_qty,
        SUM(sii.qty * sii.rate) AS billed_value
    FROM 
        `tabSales Invoice Item` sii
    JOIN 
        `tabSales Invoice` si ON si.name = sii.parent
    WHERE
        sii.docstatus = 1 
        AND si.is_return = 0        
    GROUP BY 
        sii.so_detail
) billed_data ON billed_data.so_detail = soi.name


    LEFT JOIN (
        SELECT 
            parent AS item_code,
            SUM(warehouse_reorder_level) AS total_reorder_level
        FROM `tabItem Reorder`
        GROUP BY parent
    ) AS reorder_summary ON reorder_summary.item_code = itm.item_code

    LEFT JOIN (
        SELECT 
            b.item_code,
            GROUP_CONCAT(CONCAT(b.warehouse, ' (', ROUND(b.actual_qty, 2), ')') SEPARATOR ', ') AS `Warehouse Stock`
        FROM 
            `tabBin` b
        JOIN 
            `tabWarehouse` w ON b.warehouse = w.name
        WHERE 
            w.company = %(Company)s
            AND b.actual_qty > 0
        GROUP BY 
            b.item_code
    ) AS bin_summary ON soi.item_code = bin_summary.item_code


    LEFT JOIN (
        SELECT 
            ascc.item,
            MIN(an.estimated_arrival_date) AS estimated_arrival_date
        FROM 
            `tabAdvance Shipment Child` ascc
        JOIN 
            `tabAdvance Shipment Notice` an ON ascc.parent = an.name
        WHERE 
            an.company = %(Company)s
            AND ascc.done = 0
        GROUP BY 
            ascc.item
    ) AS asn_summary ON soi.item_code = asn_summary.item

    LEFT JOIN (
        SELECT 
            poi.item_code AS item,
            (poi.qty - IFNULL(poi.received_qty, 0)) AS pending_qty,
            po.creation,
            poi.custom_date
        FROM 
            `tabPurchase Order Item` poi
        JOIN 
            `tabPurchase Order` po ON poi.parent = po.name
        WHERE 
            po.company = %(Company)s
            AND po.docstatus = 1
            AND (poi.qty - IFNULL(poi.received_qty, 0)) > 0
            AND po.creation = (
                SELECT MAX(po2.creation)
                FROM `tabPurchase Order Item` poi2
                JOIN `tabPurchase Order` po2 ON poi2.parent = po2.name
                WHERE 
                    poi2.item_code = poi.item_code
                    AND po2.company = %(Company)s
                    AND po2.docstatus = 1
                    AND (poi2.qty - IFNULL(poi2.received_qty, 0)) > 0
            )
    ) AS po_summary ON soi.item_code = po_summary.item

    WHERE  
        so.docstatus = 1
        AND so.status != 'Closed'
        AND (
            so.custom_order_status NOT IN ('NPD', 'Fore Cast')
            OR so.custom_order_status IS NULL
            OR so.custom_order_status = ''
        )
        AND so.company = %(Company)s
        AND (soi.qty - soi.delivered_qty) > 0
        AND (
            (%(from_date)s IS NULL AND %(to_date)s IS NULL)
            OR (
                (%(from_date)s IS NULL OR so.transaction_date >= %(from_date)s)
                AND (%(to_date)s IS NULL OR so.transaction_date <= %(to_date)s)
            )
        )
) AS result

ORDER BY 
    `Sales Order Date` ASC;
