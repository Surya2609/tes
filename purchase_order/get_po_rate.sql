item_code = frappe.form_dict.get('item_code')
current_supplier = frappe.form_dict.get('current_supplier')
uom = frappe.form_dict.get('uom')  # Get UOM from form dict

# Get the current date to check the validity of prices
current_date = frappe.utils.nowdate()

# Fetch price details along with UOM conversion factor
price = frappe.db.sql("""
SELECT 
    ip.price_list,
    ip.uom, 
    ip.price_list_rate, 
    ip.supplier, 
    iu.conversion_factor
FROM `tabItem Price` ip
JOIN `tabItem` i ON ip.item_code = i.item_code
LEFT JOIN `tabUOM Conversion Detail` iu 
    ON i.item_code = iu.parent 
    AND iu.uom = %s  -- Fetch conversion factor for given UOM
WHERE ip.item_code = %s 
AND ip.price_list = 'Standard Buying' 
AND (ip.valid_from <= %s OR ip.valid_from IS NULL) 
AND (ip.valid_upto >= %s OR ip.valid_upto IS NULL)
ORDER BY 
    CASE 
        WHEN ip.supplier = %s THEN 1 
        WHEN ip.supplier IS NULL THEN 2 
        ELSE 3 
    END,  -- Prioritize matching supplier, then default (NULL) supplier
    ip.supplier ASC -- Ensure consistent order for supplier match
LIMIT 1
""", (uom, item_code, current_date, current_date, current_supplier), as_dict=1)

# Return the price result
frappe.response['message'] = price if price else {"error": "No matching price found"}


-- # Fetch the item_code and supplier from form dict
-- item_code = frappe.form_dict.get('item_code')
-- current_supplier = frappe.form_dict.get('current_supplier')

-- # Get the current date to check the validity of prices
-- current_date = frappe.utils.nowdate()

-- price = frappe.db.sql("""
-- SELECT 
--     price_list, price_list_rate, supplier
-- FROM `tabItem Price` 
-- WHERE item_code = %s 
-- AND price_list = 'Standard Buying' 
-- AND (valid_from <= %s OR valid_from IS NULL) 
-- AND (valid_upto >= %s OR valid_upto IS NULL)
-- ORDER BY 
--     CASE WHEN supplier = %s THEN 1 
--          WHEN supplier IS NULL THEN 2 
--          ELSE 3 
--     END,  -- Prioritize matching supplier, then default (NULL) supplier
--     supplier ASC -- Ensure consistent order for supplier match
-- LIMIT 1
-- """, (item_code, current_date, current_date, current_supplier), as_dict=1)

-- # Return the price result
-- frappe.response['message'] = price



item_code = frappe.form_dict.get('item_code')

price = frappe.db.sql("""
SELECT 
    last_purchase_rate
FROM `tabItem` 
WHERE item_code = %s 
""", (item_code), as_dict=1)

frappe.response['message'] = price