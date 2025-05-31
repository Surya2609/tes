pr_name = frappe.form_dict.get('pr_name')
item_code = frappe.form_dict.get('item_code')

rates = frappe.db.sql(
    """
SELECT 
    sbe.batch_no AS batch_no,
    sbe.warehouse,
    b.item AS item_code,
    b.batch_qty,
    SUM(sle.actual_qty) AS available_qty
FROM 
    `tabPurchase Receipt` AS por
JOIN 
    `tabPurchase Receipt Item` AS pori ON pori.parent = por.name
JOIN 
    `tabSerial and Batch Bundle` AS sbb ON pori.serial_and_batch_bundle = sbb.name
JOIN 
    `tabSerial and Batch Entry` AS sbe ON sbb.name = sbe.parent
JOIN 
    `tabBatch` AS b ON b.name = sbe.batch_no
WHERE 
    por.name = %s  AND
    pori.item_code = %s
    """,
    (pr_name, item_code),
    as_dict=1
) 
frappe.response["message"] = rates