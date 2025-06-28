purchase_order = frappe.form_dict.get('purchase_order')

details = frappe.db.sql("""
SELECT 
    pr.name AS purchase_receipt
FROM 
    `tabPurchase Receipt` pr
JOIN 
    `tabPurchase Receipt Item` pri ON pri.parent = pr.name
WHERE 
    pri.purchase_order = %s
GROUP BY
 pr.name
""", (purchase_order,), as_dict=1)

frappe.response['message'] = details


