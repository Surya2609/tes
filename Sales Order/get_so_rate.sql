item_code = frappe.form_dict.get('item_code')
current_customer = frappe.form_dict.get('current_customer')

# Get the current date to check the validity of prices
current_date = frappe.utils.nowdate()

price = frappe.db.sql("""
SELECT 
    price_list, price_list_rate, customer
FROM `tabItem Price` 
WHERE item_code = %s 
AND price_list = 'Standard Selling' 
AND (valid_from <= %s OR valid_from IS NULL) 
AND (valid_upto >= %s OR valid_upto IS NULL)
ORDER BY 
    CASE WHEN customer = %s THEN 1 
         WHEN customer IS NULL THEN 2 
         ELSE 3 
    END,  -- Prioritize matching customer, then default (NULL) customer
    customer ASC -- Ensure consistent order for customer match
LIMIT 1
""", (item_code, current_date, current_date, current_customer), as_dict=1)

# Return the price result
frappe.response['message'] = price