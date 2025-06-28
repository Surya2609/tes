purchase_order = frappe.form_dict.get('purchase_order')
item_code = frappe.form_dict.get('item_code')
company = frappe.form_dict.get('company')
supplier_inv = frappe.form_dict.get('supplier_inv')
supplier = frappe.form_dict.get('supplier')

value = frappe.db.sql("""
SELECT 
    asn.name,
    asnc.qty
FROM 
    `tabAdvance Shipment Notice` as asn
LEFT JOIN 
    `Advance Shipment Child` as asnc ON asnc.parent = asn.name
WHERE 
    asn.company = %s AND 
    asn.supplier = %s AND
    asn.supplier_invoice_no = %s AND 
    asnc.done != 1 AND
    asnc.po_no = %s AND
    asnc.item = %s
""", (company, supplier, supplier_inv, purchase_order, item_code), as_dict=1)

frappe.response['message'] = value
