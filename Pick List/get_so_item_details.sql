parent = frappe.form_dict.get('parent')
item_code = frappe.form_dict.get('item_code')

rates = frappe.db.sql(
    """
SELECT soi.item_code, soi.qty, soi.parent
FROM `tabSales Order Item` soi
WHERE soi.parent = %s AND soi.item_code = %s
    """,
    (parent, item_code), 
    as_dict=1
)

frappe.response["message"] = rates