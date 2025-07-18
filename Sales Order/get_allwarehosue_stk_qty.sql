item_code = frappe.form_dict.get('item_code')  # Get user from request

results = frappe.db.sql("""
    SELECT SUM(actual_qty) AS total_qty
    FROM `tabBin`
    WHERE item_code = %s
    AND warehouse IN (
        SELECT name
        FROM `tabWarehouse`
        WHERE company = 'MVD FASTENERS PRIVATE LIMITED'
        AND lft > (SELECT lft FROM `tabWarehouse` WHERE name = 'All Warehouses - MVDF')
        AND rgt < (SELECT rgt FROM `tabWarehouse` WHERE name = 'All Warehouses - MVDF')
        AND name NOT IN (
            SELECT name FROM `tabWarehouse`
            WHERE lft >= (SELECT lft FROM `tabWarehouse` WHERE name = 'Picking - MVDF')
                AND rgt <= (SELECT rgt FROM `tabWarehouse` WHERE name = 'Picking - MVDF')
        )
        AND name NOT IN (
            SELECT name FROM `tabWarehouse`
            WHERE lft >= (SELECT lft FROM `tabWarehouse` WHERE name = 'Non Moving - MVDF')
                AND rgt <= (SELECT rgt FROM `tabWarehouse` WHERE name = 'Non Moving - MVDF')
        )
    );

""", (item_code,), as_dict=1)

frappe.response["message"] = results