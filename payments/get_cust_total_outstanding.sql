customer = frappe.form_dict.get('customer')
company = frappe.form_dict.get('company')

result = frappe.db.sql("""
SELECT 
    si.customer,
    SUM(si.outstanding_amount) AS total_outstanding_balance
FROM 
    `tabSales Invoice` AS si
WHERE 
    si.status IN ('Unpaid', 'Overdue')
    AND si.customer = %s
    AND si.company = %s
GROUP BY 
    si.customer;
""", (customer, company), as_dict=1)

frappe.response['message'] = result