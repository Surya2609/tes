purchase_order = frappe.form_dict.get('purchase_order')
item_code = frappe.form_dict.get('item_code')
rate = frappe.form_dict.get('rate')

value = frappe.db.sql("""
SELECT 
  pri.item_code,
  pri.parent
FROM 
    `tabPurchase Receipt Item` as pri
WHERE 
    pri.purchase_order != %s AND 
    pri.item_code = %s AND
    pri.rate = %s
""", (purchase_order, item_code, rate), as_dict=1)

frappe.response['message'] = value
