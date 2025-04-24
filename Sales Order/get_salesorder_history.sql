item_code = frappe. form_dict.get('item_code')

rates = frappe.db.sql("""
SELECT so.name, so.customer, so.status, so.transaction_date, soi.rate, soi.qty
FROM `tabSales Order Item` soi
JOIN `tabSales Order` so ON soi.parent = so.name
WHERE soi.item_code = %s AND so.status != "draft"
ORDER BY so.transaction_date DESC
""", (item_code), as_dict = 1)

frappe.response['message'] = rates