import frappe

# Fetch the item_code and UOM from form dict
item_code = frappe.form_dict.get('item_code')
uom = frappe.form_dict.get('uom')  # Get UOM from form dict

# Get the current date to check the validity of prices
current_date = frappe.utils.nowdate()

# Check if any price entry exists with a supplier
supplier_exists = frappe.db.sql("""
SELECT 1 FROM `tabItem Price` 
WHERE item_code = %s 
AND supplier IS NOT NULL 
AND price_list = 'Standard Buying' 
AND (valid_from <= %s OR valid_from IS NULL) 
AND (valid_upto >= %s OR valid_upto IS NULL)
LIMIT 1
""", (item_code, current_date, current_date))

# If a supplier exists, return nothing
if supplier_exists:
    frappe.response['message'] = {"error": "Price exists with supplier, no data fetched"}
else:
    # Fetch only records where supplier IS NULL
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
        AND iu.uom = %s  
    WHERE ip.item_code = %s 
    AND ip.price_list = 'Standard Buying' 
    AND (ip.valid_from <= %s OR ip.valid_from IS NULL) 
    AND (ip.valid_upto >= %s OR ip.valid_upto IS NULL)
    AND ip.supplier IS NULL  -- Fetch only when supplier is NULL
    ORDER BY ip.supplier ASC
    LIMIT 1
    """, (uom, item_code, current_date, current_date), as_dict=1)

    # Return the price result
    frappe.response['message'] = price if price else {"error": "No matching price found"}
