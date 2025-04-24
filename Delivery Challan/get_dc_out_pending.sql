rates = frappe.db.sql(
    """
    SELECT 
        dc.name as dc_name,
        c.*
    FROM 
        `tabDelivery Challan` dc
    JOIN `tabDC Table` c ON c.parent = dc.name   
    WHERE 
        dc.dc_in_ref = '--'
    """, 
    as_dict=True
)

frappe.response["message"] = rates



-- rates = frappe.db.sql("""
--     SELECT 
--        dc.name,
--        dci.item,
--        dci.qty,
-- FROM `tabDelivery Challan` dc
-- JOIN `tabDC Table` dci ON dc.name = dci.parent
--   WHERE dci.remaining_qty != 0;
-- """, (), as_dict=1)

-- frappe.response['message'] = rates