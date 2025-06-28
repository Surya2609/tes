-- supplier_invoice = frappe.form_dict.get('supplier_invoice')
-- item_code = frappe.form_dict.get('item_code')

-- value = frappe.db.sql("""
-- SELECT 
--      asn.name
-- FROM 
--     `tabAdvance Shipment Notice` as asn
-- LEFT JOIN 
--     `tabAdvance Shipment Child` as asnc ON asnc.parent = asn.name
-- WHERE 
--     asn.supplier_invoice_no = %s AND 
--     asnc.item = %s
-- """, (supplier_invoice, item_code), as_dict=1)

-- frappe.response['message'] = value
