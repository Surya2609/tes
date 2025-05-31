company = frappe.form_dict.get('company')

value = frappe.db.sql("""
SELECT 
        si.name
        FROM 
            `tabSales Invoice` si            
        WHERE 
            si.company = %s
            AND si.docstatus = 1
            AND si.is_return = 0
            AND NOT EXISTS (
                SELECT 1
                FROM `tabDelivery Stop` ds
                WHERE ds.custom_sales_invoice = si.name
            )

            AND NOT EXISTS (
                SELECT 1
                FROM `tabSales Invoice Item` sii
                INNER JOIN `tabDelivery Stop` ds2 ON ds2.delivery_note = sii.delivery_note
                WHERE sii.parent = si.name AND sii.delivery_note IS NOT NULL
            )            
""", (company), as_dict=1)

frappe.response['message'] = value