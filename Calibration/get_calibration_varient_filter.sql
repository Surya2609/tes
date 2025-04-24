parent_group = frappe.form_dict.get('parent_group')

val = frappe.db.sql("""
SELECT iv.name
FROM `tabInstrument Variants` iv
LEFT JOIN `tabInstruments` i ON i.parent = iv.name
WHERE i.instruments = %s
""", (parent_group), as_dict=1)

frappe.response['message'] = val