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
    WHERE 
        po.company = %s
        AND po.supplier = %s
        AND po.docstatus = 1
""", (company, supplier), as_dict=1)

frappe.response['message'] = value
