supplier_invoice_no = frappe.form_dict.get('supplier_invoice_no')

rates = frappe.db.sql(
    """
SELECT pr.name, pr.supplier_delivery_note AS supplier_invoice_no
FROM `tabPurchase Receipt` AS pr
WHERE pr.supplier_delivery_note = %s;
    """,
    (supplier_invoice_no,), 
    as_dict=1
)

frappe.response["message"] = rates