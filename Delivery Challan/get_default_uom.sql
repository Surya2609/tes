item = frappe.form_dict.get('item')

rates = frappe.db.sql("""
    SELECT item_code, item_name, stock_uom 
    FROM `tabItem`
    WHERE item_code = %s
""", (item,), as_dict=1) 

frappe.response['message'] = rates

