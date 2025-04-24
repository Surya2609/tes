warehouse = frappe.form_dict.get('warehouse')
item = frappe.form_dict.get('item')

stock_data = frappe.db.sql(
    """
    SELECT 
        b.warehouse,
        b.item_code,
        b.actual_qty,
        b.ordered_qty,
        b.reserved_qty,
        b.projected_qty
    FROM 
        `tabBin` b
    WHERE 
        b.warehouse = %s
        AND b.item_code = %s
    """,
    (warehouse, item), 
    as_dict=1
)

frappe.response["message"] = stock_data