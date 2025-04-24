item_code = frappe. form_dict.get('item_code')

rates = frappe.db.sql("""
SELECT 
    pr.name,
    pr.supplier,
    pr.supplier_delivery_note,
    pr.status,
    pr.posting_date,
    pri.rate,
    pri.qty,
    sle.actual_qty,
    sle.qty_after_transaction
FROM `tabPurchase Receipt Item` pri
JOIN `tabPurchase Receipt` pr ON pri.parent = pr.name
LEFT JOIN `tabStock Ledger Entry` sle ON sle.voucher_no = pr.name AND sle.item_code = pri.item_code
WHERE 
    pri.item_code = %s 
    AND pr.status != "Draft"
ORDER BY 
    pr.posting_date DESC
LIMIT 5
""", (item_code), as_dict=1)

frappe.response['message'] = rates