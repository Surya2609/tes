company = frappe.form_dict.get('company')

value = frappe.db.sql("""
SELECT 
    si.name, 
    si.customer, 
    si.customer_name,
    si.customer_address,
    si.customer_group, 
    si.contact_email,
    si.company,
    si.total_qty,
    si.posting_date,
    si.shipping_address,
    si.custom_temprory_ship_addr,
    sp.contact_no_1,
    sp.contact_no_2,
    sp.contact_no_3,
    sp.name AS sales_contact,
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
LEFT JOIN 
    `tabSales Person ID` sp ON sp.name = cust.custom_sales_person_id
WHERE 
    si.company = %s
    AND si.docstatus = 1
    AND si.is_return = 0
    AND NOT EXISTS (
        SELECT 1
        FROM `tabDelivery Stop` ds
        WHERE ds.custom_sales_invoice = si.name
    )
    AND NOT EXISTS (
        SELECT 1
        FROM `tabSales Invoice Item` sii
        INNER JOIN `tabDelivery Stop` ds2 ON ds2.delivery_note = sii.delivery_note
        WHERE sii.parent = si.name AND sii.delivery_note IS NOT NULL
    )
""", (company,), as_dict=1)

frappe.response['message'] = value
