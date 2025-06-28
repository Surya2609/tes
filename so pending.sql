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
    (soi.qty - soi.delivered_qty)          AS `Pending Qty`,
    soi.rate                               AS `Unit Rate`,
    soi.amount                             AS `Total Amount`,
    (soi.qty - soi.delivered_qty) * soi.rate AS `Pending Amount`,
    soi.warehouse                          AS `Target Warehouse`,
    bin_summary.`Warehouse Stock`          AS `Warehouse Stock`,
    poi.custom_remark                       AS `Remark`,
    poi.custom_date                         AS `ETA`

FROM 
    `tabSales Order` so
JOIN 
    `tabSales Order Item` soi 
    ON so.name = soi.parent 
    AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")
LEFT JOIN 
    `tabSales Person ID` spi 
    ON so.custom_sales_person_id = spi.name
LEFT JOIN 
    `tabItem` itm 
    ON soi.item_code = itm.item_code
    
LEFT JOIN (
    SELECT 
        parent AS item_code,
        SUM(warehouse_reorder_level) AS total_reorder_level
    FROM `tabItem Reorder`
    GROUP BY parent
) AS reorder_summary ON reorder_summary.item_code = item.item_code

LEFT JOIN (
    SELECT 
        b.item_code,
        GROUP_CONCAT(
            CONCAT(b.warehouse, ' (', ROUND(b.actual_qty, 2), ')') 
            SEPARATOR ', '
        ) AS `Warehouse Stock`
    FROM 
        `tabBin` b
    JOIN 
        `tabWarehouse` w 
        ON b.warehouse = w.name
    WHERE 
        w.company = %(Company)s
        AND b.actual_qty > 0
    GROUP BY 
        b.item_code
) bin_summary 
    ON soi.item_code = bin_summary.item_code

-- ✅ Link to PO via Material Request
LEFT JOIN `tabMaterial Request Item` mri
    ON mri.sales_order = soi.parent
    AND mri.item_code = soi.item_code

LEFT JOIN `tabPurchase Order Item` poi
    ON poi.material_request = mri.parent
    AND poi.item_code = mri.item_code

LEFT JOIN `tabPurchase Order` po
    ON poi.parent = po.name
    AND po.docstatus = 1

WHERE  
    so.docstatus = 1
    AND so.status != 'Closed'
    AND so.company = %(Company)s
    AND (soi.qty - soi.delivered_qty) > 0
    AND (
        (%(from_date)s IS NULL AND %(to_date)s IS NULL)
        OR (
            (%(from_date)s IS NULL OR so.transaction_date >= %(from_date)s)
            AND (%(to_date)s IS NULL OR so.transaction_date <= %(to_date)s)
        )
    )
ORDER BY 
    so.transaction_date ASC;