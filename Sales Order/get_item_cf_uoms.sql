item = frappe.form_dict.get('item')  # Get user from request

values = frappe.db.sql("""
    SELECT 
    i.name AS item_code,
    u.uom,
    u.conversion_factor,
    i.stock_uom
FROM 
    `tabItem` i
JOIN 
    `tabUOM Conversion Detail` u ON i.name = u.parent
WHERE 
    i.name = %s
""", (item), as_dict=1)

frappe.response["message"] = values