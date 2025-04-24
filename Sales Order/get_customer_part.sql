item_code = frappe.form_dict.get('item_code')  # Item Code from the request
customer = frappe.form_dict.get('customer')  # Customer from the request
customer_part_code = frappe.form_dict.get('customer_part_code')  # Customer Part Code from the request

if item_code:
    # Query when Item Code is provided
    value = frappe.db.sql("""
    SELECT 
        icd.ref_code, 
        icd.customer_name,
        icd.custom_description, 
        i.item_name,
        t.*
    FROM `tabItem Customer Detail` icd
    JOIN `tabItem` i ON icd.parent = i.name
    LEFT JOIN `tabItem Tax` t ON t.parent = i.name
    WHERE 
        i.name = %s
        AND icd.customer_name = %s
    """, (item_code, customer), as_dict=1)
else:
    # Query when Customer Part Code is provided
    value = frappe.db.sql("""
    SELECT 
        icd.ref_code, 
        icd.customer_name,
        icd.custom_description, 
        i.name AS item_code, 
        i.item_name,
        t.*
    FROM `tabItem Customer Detail` icd
    JOIN `tabItem` i ON icd.parent = i.name
    LEFT JOIN `tabItem Tax` t ON t.parent = i.name
    WHERE 
        icd.ref_code = %s
        AND icd.customer_name = %s
    """, (customer_part_code, customer), as_dict=1)

# Set the response
frappe.response['message'] = value
