SELECT 
    so.name AS `Sales Order`,                           
    so.transaction_date AS `Sales Order Date`,          
    soi.delivery_date AS `Required Date`,               
    so.currency AS `Currency`,                          
    so.po_no AS `Customer PO Number`,                   
    so.po_date AS `Customer PO Date`,                   
    spi.name AS `Sales Person ID`,                      
    so.customer AS `Customer ID`,                       
    so.customer_name AS `Customer Name`,                
    itm.gst_hsn_code AS `HSN Code`,                     
    soi.item_code AS `Item Code`,                       
    soi.item_name AS `Item Name`,                       
    soi.stock_uom AS `UOM`,                             
    soi.stock_qty AS `Ordered Qty`,                           
    (soi.stock_qty - soi.picked_qty) AS `Pending Qty`,     
    soi.rate AS `Unit Rate`,                            
    soi.amount AS `Total Amount`,                       
    (soi.qty - soi.delivered_qty) * soi.rate AS `Pending Amount`, 
    soi.warehouse AS `Target Warehouse`,                
    bin_summary.`Warehouse Stock` AS `Warehouse Stock`
FROM 
    `tabSales Order` so
JOIN 
    `tabSales Order Item` soi 
    ON so.name = soi.parent 
    AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")
LEFT JOIN 
    `tabSales Person ID` spi 
    ON so.custom_sales_person_id = spi.name  
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
) bin_summary 
    ON soi.item_code = bin_summary.item_code
LEFT JOIN 
    `tabItem` itm 
    ON soi.item_code = itm.item_code  
WHERE 
    so.docstatus = 1
    AND so.company = %(Company)s
    AND (
        (%(from_date)s IS NULL AND %(to_date)s IS NULL)
        OR (
            (%(from_date)s IS NULL OR so.transaction_date >= %(from_date)s)
            AND (%(to_date)s IS NULL OR so.transaction_date <= %(to_date)s)
        )
    )
    AND (soi.qty - soi.delivered_qty) > 0
ORDER BY 
    so.transaction_date ASC;
