so = frappe.form_dict.get('so')

valuess = frappe.db.sql("""
    SELECT 
        so.address_display
    FROM 
        `tabSales Order` so
    WHERE 
        so.name = %s
""", (so,), as_dict=1)

frappe.response['message'] = valuess