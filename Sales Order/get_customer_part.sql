item_code = frappe.form_dict.get('item_code')
customer = frappe.form_dict.get('customer')
customer_part_code = frappe.form_dict.get('customer_part_code')

value = []

if item_code and customer:
    # Query when Item Code is provided
    value = frappe.db.sql("""
        SELECT 
            cm.customer_part_code, 
            cc.customer,
            cc.customer_description,
            cm.item,
            i.item_name
        FROM `tabCustomer Part Mapping` cm
        JOIN `tabCustomer Mapping Child` cc ON cc.parent = cm.name
        JOIN `tabItem` i ON i.name = cm.item
        WHERE 
            cm.item = %s
            AND cc.customer = %s
    """, (item_code, customer), as_dict=1)

elif customer_part_code and customer:
    # Query when Customer Part Code is provided
    value = frappe.db.sql("""
        SELECT 
            cm.customer_part_code, 
            cc.customer,
            cc.customer_description,
            cm.item,
            i.item_name
        FROM `tabCustomer Part Mapping` cm
        JOIN `tabCustomer Mapping Child` cc ON cc.parent = cm.name
        JOIN `tabItem` i ON i.name = cm.item
        WHERE 
            cm.customer_part_code = %s
            AND cc.customer = %s
    """, (customer_part_code, customer), as_dict=1)

frappe.response['message'] = value