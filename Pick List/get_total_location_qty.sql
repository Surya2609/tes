location = frappe.form_dict.get('location')
item_code = frappe.form_dict.get('item_code')

rates = frappe.db.sql(
    """
SELECT
    actual_qty
FROM
    `tabBin`
WHERE
    item_code = %s
    AND warehouse = %s;
    """,
    (item_code, location), 
    as_dict=1
)

frappe.response["message"] = rates
