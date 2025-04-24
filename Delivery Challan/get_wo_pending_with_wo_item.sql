item = frappe.form_dict.get('item')

rates = frappe.db.sql("""
    SELECT 
        dcs.reference_id, 
        dcs.qty, 
        dcs.uom,
        dcs.remaining_qty, 
        dcs.went_qty, 
        dcs.item,
        (SELECT SUM(remaining_qty) 
         FROM `tabDelivery Challan Stocks` 
         WHERE item = %s AND remaining_qty != '0') AS total_remaining_qty
    FROM `tabDelivery Challan Stocks` dcs
    WHERE dcs.remaining_qty != '0' 
      AND dcs.item = %s 
      AND dcs.from = "Work Order"
    ORDER BY dcs.creation ASC  -- Ensures first-added records appear first
""", (item, item), as_dict=1)

frappe.response['message'] = rates
