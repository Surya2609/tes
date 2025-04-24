item_code = frappe.form_dict.get('item_code')  # Item Code from the request
customer = frappe.form_dict.get('customer')  # Customer from the request
customer_part_code = frappe.form_dict.get('customer_part_code')  # Customer Part Code from the request

if item_code:
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
else:
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

# Set the response
frappe.response['message'] = value
