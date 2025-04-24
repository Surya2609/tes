parent_name = frappe.form_dict.get('parent_name')

valuess = frappe.db.sql("""
    SELECT 
        dni.item_code, 
        dni.item_name, 
        dni.custom_customer_part_code, 
        dni.qty, 
        dni.quality_inspection,
        dni.batch_no
    FROM 
        `tabDelivery Note Item` dni
    INNER JOIN 
        `tabItem` ti ON dni.item_code = ti.item_code
    WHERE 
        dni.parent = %s 
        AND ti.inspection_required_before_purchase = 1 
        AND dni.quality_inspection IS NULL
""", (parent_name,), as_dict=1)

frappe.response['message'] = valuess