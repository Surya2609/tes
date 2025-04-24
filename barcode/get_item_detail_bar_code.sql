item_code = frappe.form_dict.get('item_code')

rates = frappe.db.sql(
    """
SELECT 
    i.item_code,
    i.item_name,
    i.stock_uom
FROM 
    `tabItem` AS i
WHERE 
    i.item_code = %s 
    """,
    (item_code),
    as_dict=1
) 

frappe.response["message"] = rates