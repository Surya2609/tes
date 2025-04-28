item_code = frappe. form_dict.get('item_code')
customer = frappe. form_dict.get('customer')

rates = frappe.db.sql("""
SELECT p.name
FROM `tabOld SO Report` p
JOIN `tabOld SO Child` c ON c.parent = p.name
WHERE c.item_code = %s AND p.customer = %s
ORDER BY p.so_date DESC
""", (item_code, customer), as_dict = 1)

frappe.response['message'] = rates