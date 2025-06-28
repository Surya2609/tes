purchase_order = frappe.form_dict.get('purchase_order')

details = frappe.db.sql("""
SELECT 
    asn.name AS ASN
FROM 
    `tabAdvance Shipment Notice` asn
JOIN 
    `tabAdvance Shipment Child` ascc ON ascc.parent = asn.name
WHERE 
    ascc.po_no = %s
GROUP BY
 asn.name
""", (purchase_order,), as_dict=1)

frappe.response['message'] = details