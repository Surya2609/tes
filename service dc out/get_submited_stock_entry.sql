stock_name = frappe.form_dict.get('stock_name')

rates = frappe.db.sql(
    """
    SELECT 
        se.name AS stock_entry_name,
        sed.item_code,
        sbe.batch_no,
        sed.uom,
        sed.transfer_qty,
        sed.t_warehouse,
        sed.s_warehouse,
        sed.stock_uom,
        sed.conversion_factor,
        sed.qty
    FROM 
        `tabStock Entry` se
    JOIN `tabStock Entry Detail` sed ON sed.parent = se.name
    JOIN `tabSerial and Batch Bundle` sbb ON sbb.name = sed.serial_and_batch_bundle
    JOIN `tabSerial and Batch Entry` sbe ON sbe.parent = sbb.name
    WHERE 
        se.docstatus = 1
        AND se.name = %s
    """,
    (stock_name,), 
    as_dict=1
)

frappe.response["message"] = rates