supplier = frappe.form_dict.get('supplier') 

rates = frappe.db.sql(
    """
    SELECT 
    p.name,    
    p.custom_default_dc_warehouse
FROM `tabSupplier` AS p
WHERE p.name = %s;
    """,
    (supplier),
    as_dict = 1
)
frappe.response ["message"] = rates