sales_order = frappe.form_dict.get('sales_order')

rates = frappe.db.sql(
    """
SELECT 
    so.name,
    so.po_no,
    so.po_date
FROM 
    `tabSales Order` AS so
WHERE 
    so.name = %s 
    """,
    (sales_order),
    as_dict=1
) 

frappe.response["message"] = rates