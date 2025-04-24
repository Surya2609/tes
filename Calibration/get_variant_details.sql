variant_name = frappe.form_dict.get('variant_name')

price = frappe.db.sql("""
SELECT 
# iv.*
    iv.size AS variant_name,
    iv.make,
    iv.serial_number,
    iv.instrument_id,
    iv.least_count
FROM 
    `tabInstrument Variants` iv
WHERE 
    iv.name = %s
LIMIT 1
""", (variant_name), as_dict=1)

frappe.response['message'] = price
