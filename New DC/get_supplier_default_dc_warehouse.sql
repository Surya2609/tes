supplier = frappe.form_dict.get('supplier') 

rates = frappe.db.sql(
    """
    SELECT 
    name,
    custom_default_dc_warehouse
FROM 
    `tabSupplier`
WHERE 
    name = %s;
    """,
    (supplier,),
    as_dict = 1
) frappe.response ["message"] = rates