so_id = frappe.form_dict.get('so_id')

rates = frappe.db.sql("""
    SELECT pl.name AS pick_list_id, pli.sales_order
    FROM `tabPick List` AS pl
    JOIN `tabPick List Item` AS pli ON pli.parent = pl.name
    WHERE pli.sales_order = %s
    GROUP BY pl.name
""", (so_id,), as_dict=1)

frappe.response['message'] = rates