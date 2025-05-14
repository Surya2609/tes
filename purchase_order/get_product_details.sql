item_code = frappe.form_dict.get('item_code')

item_details_and_stock = frappe.db.sql("""
SELECT 
    i.item_code,
    i.min_order_qty,
    i.item_name,
    i.description,
    i.stock_uom,    
    i.stock_uom,
    b.warehouse,
    COALESCE(b.actual_qty, 0) AS stock_in_warehouse,
    (SELECT SUM(actual_qty) 
     FROM `tabBin` 
     WHERE item_code = i.item_code) AS  
FROM 
    `tabItem` i
LEFT JOIN 
    `tabBin` b ON i.item_code = b.item_code
WHERE 
    i.item_code = %s
ORDER BY 
    b.warehouse ASC
""", (item_code,), as_dict=1)

frappe.response['message'] = item_details_and_stock