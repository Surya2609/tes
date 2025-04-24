item_code = frappe. form_dict.get('item_code')

rates = frappe.db.sql("""
SELECT p.diagram_name, c.item_code, p.diagram, p.notes
FROM `tabItem Diagram Mapper` p
JOIN `tabSelected Items Table` c ON c.parent = p.name
WHERE c.item_code = %s
""", (item_code), as_dict = 1)

frappe.response['message'] = rates