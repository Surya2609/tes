company = frappe.form_dict.get('company')

value = frappe.db.sql("""
SELECT 
    si.name, 
    si.customer, 
    si.customer_address,
    si.customer_group, 
    si.contact_email,
    si.company,
    si.total_qty,
    addr.address_line1, 
    addr.address_line2, 
    addr.city, 
    addr.state, 
    addr.country, 
    addr.pincode,
    cust.gstin
FROM 
    `tabSales Invoice` si
LEFT JOIN 
    `tabAddress` addr ON addr.name = si.customer_address
LEFT JOIN 
    `tabCustomer` cust ON cust.name = si.customer
WHERE 
    si.company = %s
""", (company,), as_dict=1)

frappe.response['message'] = value
