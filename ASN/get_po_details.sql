company = frappe.form_dict.get('company')
supplier = frappe.form_dict.get('supplier')

value = frappe.db.sql("""
    SELECT 
        po.name,
        poi.item_code,
        poi.item_name,
        poi.gst_hsn_code,
        poi.qty,
        poi.uom,
        poi.rate,
        poi.warehouse,
        poi.schedule_date
    FROM 
        `tabPurchase Order` po
    JOIN 
        `tabPurchase Order Item` poi ON poi.parent = po.name
    LEFT JOIN 
        `tabAdvance Shipment Child` as asnc ON asnc.parent = asn.name
    LEFT JOIN 
        `tabAdvance Shipment Notice` as asn ON asnc.parent = asn.name
    WHERE 
        po.company = %s
        AND po.supplier = %s
        AND po.docstatus = 1
""", (company, supplier), as_dict=1)

frappe.response['message'] = value




supplier_invoice = frappe.form_dict.get('supplier_invoice')
item_code = frappe.form_dict.get('item_code')

value = frappe.db.sql("""
SELECT 
     asn.name
FROM 
    `tabAdvance Shipment Notice` as asn
LEFT JOIN 
    `tabAdvance Shipment Child` as asnc ON asnc.parent = asn.name
WHERE 
    asn.supplier_invoice_no = %s AND 
    asnc.item = %s
""", (supplier_invoice, item_code), as_dict=1)

frappe.response['message'] = value
