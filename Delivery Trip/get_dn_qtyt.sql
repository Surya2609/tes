delivery_note = frappe. form_dict.get('delivery_note')

rates = frappe.db.sql("""
SELECT dn.total_qty, dn.name
FROM `tabDelivery Note Item` dni
JOIN `tabDelivery Note` dn ON dni.parent = dn.name
WHERE dn.name = %s
LIMIT 1
""", (delivery_note), as_dict = 1)

frappe.response['message'] = rates