parent_name = frappe.form_dict.get('parent_name')

valuess = frappe.db.sql("""
    SELECT 
    # pri.*
        pri.item_code, 
        pri.item_name, 
        pri.received_qty, 
        pri.quality_inspection,
        pri.description
    FROM 
        `tabPurchase Receipt Item` pri
    INNER JOIN 
        `tabItem` ti ON pri.item_code = ti.item_code
    WHERE 
        pri.parent = %s 
        AND ti.inspection_required_before_purchase = 1 
        AND pri.quality_inspection IS NULL
""", (parent_name,), as_dict=1)

frappe.response['message'] = valuess