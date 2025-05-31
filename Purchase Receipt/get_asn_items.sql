company = frappe.form_dict.get('company')
supplier = frappe.form_dict.get('supplier')

value = frappe.db.sql("""
SELECT 
    asn_item.name AS id,
    asn.name,
    asn.supplier,
    asn.supplier_invoice_no,
    asn.supplier_invoice_date,
    asn.estimated_arrival_date,
    asn.llr,
    asn.transporter,
    asn_item.item,
    asn_item.qty,
    asn_item.uom,
    asn_item.rate,
    asn_item.amount,
    asn_item.po_no
FROM 
    `tabAdvance Shipment Notice` as asn
JOIN 
    `tabAdvance Shipment Child` as asn_item ON asn_item.parent = asn.name
WHERE 
    asn_item.done != 1 AND 
    asn.company = %s AND
    asn.supplier = %s
""", (company, supplier), as_dict=1)

frappe.response['message'] = value
