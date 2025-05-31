delivery_note = frappe.form_dict.get('delivery_note')

rates = frappe.db.sql("""
    SELECT dn.name, dn.posting_date, c.name, sp.contact_no_1, sp.contact_no_2, sp.contact_no_3, sp.name AS salesPersonId
    FROM `tabDelivery Note` dn
    JOIN `tabCustomer` c ON c.name = dn.customer
    JOIN `tabSales Person ID` sp ON sp.name = c.custom_sales_person_id
    WHERE dn.name = %s
    LIMIT 1
""", (delivery_note), as_dict=1)

frappe.response['message'] = rates
