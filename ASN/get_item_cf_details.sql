item_code = frappe.form_dict.get('item_code')
uom = frappe.form_dict.get('uom')

value = frappe.db.sql("""
SELECT 
        SELECT 
    i.name AS item,
    ucd.uom,
    ucd.conversion_factor
FROM 
    `tabItem` i
JOIN 
    `tabUOM Conversion Detail` ucd ON ucd.parent = i.name
WHERE 
    i.name = %s
     AND
    ucd.uom = %s
""", (item_code, uom), as_dict=1)

frappe.response['message'] = value