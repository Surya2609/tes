company_name = frappe.form_dict.get('company_name')

valuess = frappe.db.sql("""
SELECT dn.name, dn.customer, dn.custom_quality_status FROM `tabDelivery Note` dn
WHERE dn.custom_quality_status = "Pending" AND dn.company = %s
""", (company_name), as_dict=1)
frappe.response['message'] = valuess