asn_id = frappe.form_dict.get('asn_id')
item_code = frappe.form_dict.get('item_code')

value = frappe.db.sql("""
SELECT 
    asnc.name
FROM 
    `tabAdvance Shipment Notice` as asn
LEFT JOIN 
    `tabAdvance Shipment Child` as asnc ON asnc.parent = asn.name
WHERE 
    asn.name = %s AND 
    asnc.item = %s AND
    asnc.done != 1
""", (asn_id, item_code), as_dict=1)

frappe.response['message'] = value
