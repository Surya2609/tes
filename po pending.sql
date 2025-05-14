SELECT 
    po.name                          AS `Purchase Order`,                  -- Purchase Order ID
    po.transaction_date              AS `Purchase Order Date`,             -- PO Date
    poi.schedule_date                AS `Required Date`,                   -- Required Date
    po.currency                      AS `Currency`,                        -- Currency
    po.supplier                      AS `Supplier ID`,                     -- Supplier ID
    sup.supplier_name                AS `Supplier Name`,                   -- Supplier Name
    po.status                        AS `Status`,                          -- Status
    itm.gst_hsn_code                 AS `HSN Code`,                        -- HSN Code
    poi.item_code                    AS `Item Code`,                       -- Item Code
    poi.item_name                    AS `Item Name`,                       -- Item Name
    poi.uom                          AS `UOM`,                             -- UOM
    poi.qty                          AS `Ordered Qty`,                     -- Ordered Quantity
    (poi.qty - poi.received_qty)     AS `Pending Qty`,                     -- Pending Quantity
    poi.rate                         AS `Unit Rate`,                       -- Unit Rate
    poi.amount                       AS `Total Amount`,                    -- Total Amount
    (poi.qty - poi.received_qty)*poi.rate AS `Pending Amount`,             -- Pending Amount
    poi.warehouse                    AS `Target Warehouse`,                -- Target Warehouse
    bin_summary.`Current Stock in All Warehouses` AS `Warehouse Stock`    -- Warehouse Stock with Quantity
FROM 
    `tabPurchase Order` po
JOIN 
    `tabPurchase Order Item` poi ON po.name = poi.parent
LEFT JOIN
    `tabSupplier` sup ON po.supplier = sup.name
LEFT JOIN (
    SELECT 
        b.item_code,
        GROUP_CONCAT(
            CONCAT(b.warehouse, ' (', ROUND(b.actual_qty), ')') 
            SEPARATOR ', '
        ) AS `Current Stock in All Warehouses`
    FROM 
        `tabBin` b
    JOIN 
        `tabWarehouse` w ON b.warehouse = w.name
    WHERE 
        w.company = %(Company)s            -- only warehouses of that company
    GROUP BY 
        b.item_code
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
    po.transaction_date ASC;

