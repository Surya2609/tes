user = frappe.form_dict.get('user')  # Get user from request

employees = frappe.db.sql("""
    SELECT
        c.name AS company,
        c.custom_rejected_item,
        c.custom_sub_contract,
        c.custom_work_in_process,
        c.custom_default_good_parent
    FROM
        `tabEmployee` e
    JOIN
        `tabCompany` c ON e.company = c.name
    WHERE
        e.user_id = %s
    LIMIT 1
""", (user,), as_dict=1)

frappe.response["message"] = employees