item_code = frappe.form_dict.get('item_code')
 
sales_data = frappe.db.sql("""
SELECT 
    -- sale_month for last 4 months
    DATE_FORMAT(si.posting_date, '%%Y-%%m') AS sale_month,
    
    -- Total quantity sold in that month
    SUM(sii.qty) AS total_quantity_sold,
    
    -- Average quantity for current year (from January to current month)
    (SELECT ROUND(SUM(sii.qty) / COUNT(DISTINCT MONTH(si.posting_date)), 2) 
     FROM `tabSales Invoice Item` sii
     JOIN `tabSales Invoice` si ON sii.parent = si.name
     WHERE sii.item_code = %s
     AND YEAR(si.posting_date) = YEAR(CURDATE())
     AND si.posting_date <= CURDATE()) AS average_qty_current_year,
    
    -- Average quantity for last year (full 12 months)
    (SELECT ROUND(SUM(sii.qty) / 12, 2) 
     FROM `tabSales Invoice Item` sii
     JOIN `tabSales Invoice` si ON sii.parent = si.name
     WHERE sii.item_code = %s
     AND YEAR(si.posting_date) = YEAR(CURDATE()) - 1) AS avg_qty_last_year

FROM 
    `tabSales Invoice Item` sii
JOIN 
    `tabSales Invoice` si ON sii.parent = si.name
WHERE 
    sii.item_code = %s
    AND si.posting_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%%Y-%%m-01')
GROUP BY 
    DATE_FORMAT(si.posting_date, '%%Y-%%m')
ORDER BY 
    sale_month DESC;
""", (item_code, item_code, item_code), as_dict=1)

frappe.response['message'] = sales_data