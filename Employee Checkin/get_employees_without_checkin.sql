today_date = frappe.form_dict.get('date_filter')

if not today_date:
    frappe.response['message'] = {"error": "Date filter is missing"}
else:
    missing_employees = frappe.db.sql("""
        SELECT emp.name, emp.employee_name, emp.company
        FROM `tabEmployee` emp
        WHERE emp.status = 'Active'
        AND emp.name NOT IN (
            SELECT ec.employee
            FROM `tabEmployee Checkin` ec
            WHERE ec.custom_date_in = %s
        )
    """, (today_date,), as_dict=1)

    frappe.response['message'] = missing_employees