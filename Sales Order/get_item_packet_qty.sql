

item = frappe.form_dict.get('item') 
customer = frappe.form_dict.get('customer')

valuess = frappe.db.sql("""
    SELECT
        itm.name AS item,
        itm.stock_uom,
        itm.custom_1_packet_qty_nos,
        itm.custom_1_packet_qty_kg
    FROM
        `tabItem` itm
    JOIN 
        `tabCustomer` cust
    WHERE
        itm.item_code = %s  AND
        cust.custom_premium_customer = %s
    LIMIT 1
""", (item), as_dict=1)

frappe.response["message"] = valuess