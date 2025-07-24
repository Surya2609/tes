-- valuess = frappe.db.sql("""
-- SELECT pr.name,pr.custom_quality_status FROM `tabPurchase Receipt` pr
-- WHERE pr.custom_quality_status = "Pending"
-- """, (), as_dict=1)
-- frappe.response['message'] = valuess



company_name = frappe.form_dict.get('company_name')

valuess = frappe.db.sql("""
    SELECT
    pr.name,
    pr.custom_quality_status,
    pr.supplier,
    sup.supplier_name,
    pr.company
FROM
    `tabPurchase Receipt` pr
LEFT JOIN
    `tabSupplier` sup ON pr.supplier = sup.name
WHERE
    pr.custom_quality_status = 'Pending'
    AND pr.company = %s
    AND pr.docstatus = 1
""", (company_name), as_dict=1)

frappe.response['message'] = valuess