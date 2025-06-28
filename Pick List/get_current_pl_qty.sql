item_code = frappe.form_dict.get('item_code')
so_no = frappe.form_dict.get('so_no')

rates = frappe.db.sql(
    """
    SELECT
        kot.name,
        kot.total_picked_qty,
        kot.kot_qty,
        kot.base_uom,
        kot.convertion_factor,
        kot.so_uom
    FROM
        `tabKOT Report` AS kot
    WHERE
         IFNULL(kot.so_qty, 0) != IFNULL(kot.total_picked_qty, 0) AND
         item_code = %s
         AND sales_order = %s
    """,
    (item_code, so_no), 
    as_dict=1
)

frappe.response["message"] = rates
