item_code = frappe.form_dict.get('item_code') 
warehouse = frappe.form_dict.get('warehouse') 

rates = frappe.db.sql(
    """
    SELECT 
        sbe.batch_no AS batch_no,
        sbe.warehouse,
        b.item AS item_code,
        SUM(sle.actual_qty) AS available_qty
    FROM 
        `tabSerial and Batch Entry` AS sbe
    JOIN 
        `tabSerial and Batch Bundle` AS sbb ON sbe.parent = sbb.name
    JOIN 
        `tabStock Ledger Entry` AS sle ON sle.serial_and_batch_bundle = sbb.name
    JOIN 
        `tabBatch` AS b ON b.name = sbe.batch_no
    WHERE 
        b.item = %s
        AND sbe.warehouse = %s
        AND sle.actual_qty > 0
    GROUP BY 
        sbe.batch_no, sbe.warehouse, b.item
    HAVING 
        available_qty > 0;
    """,
    (item_code, warehouse),  # Correct usage of variables
    as_dict=1
) 

frappe.response["message"] = rates
