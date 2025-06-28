item_code = frappe.form_dict.get('item_code')
invoice_no = frappe.form_dict.get('invoice_no')
po_no = frappe.form_dict.get('po_no')

value = frappe.db.sql("""
SELECT         
    pr.name AS pr_id,
    pri.qty 
FROM 
    `tabPurchase Receipt` pr
JOIN 
    `tabPurchase Receipt Item` pri ON pri.parent = pr.name
WHERE 
    pr.supplier_delivery_note = %s AND
    pri.item_code = %s AND
    pri.purchase_order = %s
""", (invoice_no, item_code, po_no), as_dict=1)

frappe.response['message'] = value