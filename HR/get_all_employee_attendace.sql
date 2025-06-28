
value = frappe.db.sql("""
        SELECT 
            emp.name,
            emp.department,
            emp.image,
            emp.employee_name,
            emp.company
        FROM 
            `tabEmployee` emp
        WHERE 
            emp.status = 'Active'
            AND emp.image IS NOT NULL
""", (), as_dict=1)

frappe.response['message'] = value
