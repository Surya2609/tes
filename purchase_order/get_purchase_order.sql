item_code = frappe. form_dict.get('item_code')

rates = frappe.db.sql("""
SELECT po.name, po.supplier, po.status, po.transaction_date, poi.rate, poi.qty
FROM `tabPurchase Order Item` poi
JOIN `tabPurchase Order` po ON poi.parent = po.name
WHERE poi.item_code = %s AND po.status != "draft"
ORDER BY po.transaction_date DESC
""", (item_code), as_dict = 1)

frappe.response['message'] = rates