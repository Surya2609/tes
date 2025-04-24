item_code = frappe.form_dict.get('item_code')

rates = frappe.db.sql("""
SELECT 
    dn.name,
    dn.customer,
    dn.status,
    dn.posting_date,
    dni.rate,
    dni.qty
    # sle.qty_after_transaction,
FROM `tabDelivery Note Item` dni
JOIN `tabDelivery Note` dn ON dni.parent = dn.name
LEFT JOIN `tabStock Ledger Entry` sle ON sle.voucher_no = dn.name AND sle.item_code = dni.item_code
WHERE 
    dni.item_code = %s 
    AND dn.status != "Draft"
ORDER BY 
    dn.posting_date DESC
LIMIT 5
""", (item_code), as_dict=1)

frappe.response['message'] = rates