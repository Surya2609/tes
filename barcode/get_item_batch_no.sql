item_code = frappe.form_dict.get('item_code') 
warehouse = frappe.form_dict.get('warehouse') 

rates = frappe.db.sql(
    """
SELECT 
    sbe.batch_no AS batch_no,
    sbe.warehouse,
    b.item AS item_code,
    b.batch_qty,
    SUM(sle.actual_qty) AS available_qty
FROM 
    `tabStock Ledger Entry` AS sle
JOIN 
    `tabSerial and Batch Bundle` AS sbb ON sle.serial_and_batch_bundle = sbb.name
JOIN 
    `tabSerial and Batch Entry` AS sbe ON sbb.name = sbe.parent
JOIN 
    `tabBatch` AS b ON b.name = sbe.batch_no
WHERE 
    b.item = "Testing Code 1"
    AND sbe.warehouse = "Finished Goods - MFPL"
    AND sle.is_cancelled = 0
GROUP BY 
    sbe.batch_no, sbe.warehouse, b.item, b.batch_qty
HAVING 
    available_qty > 0 
ORDER BY 
    available_qty DESC;
    """,
    (item_code, warehouse),  # Correct usage of variables
    as_dict=1
) 

frappe.response["message"] = rates