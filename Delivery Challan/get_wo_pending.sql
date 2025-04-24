rates = frappe.db.sql("""
    SELECT dcs.reference_id, dcs.qty, dcs.remaining_qty, dcs.went_qty, dcs.item
    FROM `tabDelivery Challan Stocks` dcs
    WHERE dcs.remaining_qty != '0'
""", (), as_dict=1)

frappe.response['message'] = rates