parent_group = frappe. form_dict.get('parent_group')

val = frappe.db.sql("""
SELECT parent.name
FROM `tabSub Group 1` AS parent
INNER JOIN `tabSub Group 1 Child` AS child ON child.parent = parent.name
WHERE child.parent_group_name = %s
""", (parent_group), as_dict=1)
    
frappe.response['message'] = val