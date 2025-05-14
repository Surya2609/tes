SELECT 
    po.name AS `Purchase Order`,
    po.transaction_date AS `Purchase Order Date`,
    poi.schedule_date AS `Required Date`,
    po.company AS `Company`,
    po.supplier AS `Supplier`,
    sup.supplier_name AS `Supplier Name`,
    po.status AS `Status`,
    poi.item_code AS `Item Code`,
    poi.item_name AS `Item Name`,
    poi.uom AS `UOM`,
    poi.qty AS `Ordered Qty`,
    (poi.qty - poi.received_qty) AS `Pending Qty`,
    bin_summary.`Current Stock in All Warehouses`,
    poi.rate AS `Unit Rate`,
    poi.amount AS `Total Amount`,
    (poi.qty - poi.received_qty) * poi.rate AS `Pending Amount`,
    poi.warehouse AS `Target Warehouse`,
    po.currency AS `Currency`,  -- Currency
    itm.gst_hsn_code AS `HSN Code`  -- Adjusted for correct field name
FROM 
    `tabPurchase Order` po
JOIN 
    `tabPurchase Order Item` poi ON po.name = poi.parent
LEFT JOIN
    `tabSupplier` sup ON po.supplier = sup.name
LEFT JOIN (
    SELECT 
        item_code,
        GROUP_CONCAT(CONCAT(warehouse, ' (', ROUND(actual_qty), ')') SEPARATOR ', ') AS `Current Stock in All Warehouses`
    FROM 
        `tabBin`
    GROUP BY 
        item_code
) bin_summary ON bin_summary.item_code = poi.item_code
LEFT JOIN 
    `tabItem` itm ON poi.item_code = itm.item_code
WHERE 
    po.docstatus = 1
    AND po.company = %(Company)s
    AND (
        (%(from_date)s IS NULL AND %(to_date)s IS NULL)
        OR (
            (%(from_date)s IS NULL OR po.transaction_date >= %(from_date)s)
            AND (%(to_date)s IS NULL OR po.transaction_date <= %(to_date)s)
        )
    )
    AND (poi.qty - poi.received_qty) > 0
ORDER BY 
    po.transaction_date ASC
