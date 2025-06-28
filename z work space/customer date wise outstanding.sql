SELECT
    si.customer AS `Customer Id`,
    c.customer_name AS `Customer Name`,

    ROUND(SUM(CASE WHEN si.outstanding_amount > 0 THEN si.outstanding_amount ELSE 0 END), 2) AS `Total Pending Amount`,

    ROUND((
        SELECT pe.paid_amount
        FROM `tabPayment Entry Reference` per
        JOIN `tabPayment Entry` pe ON pe.name = per.parent
        WHERE per.reference_name = si.name
          AND per.reference_doctype = 'Sales Invoice'
          AND pe.docstatus = 1
        ORDER BY pe.posting_date DESC
        LIMIT 1
    ), 2) AS `Last Paid Amount`,

    ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), si.posting_date) BETWEEN 0 AND 30 THEN si.outstanding_amount ELSE 0 END), 2) AS `0 - 30`,
    ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), si.posting_date) BETWEEN 31 AND 60 THEN si.outstanding_amount ELSE 0 END), 2) AS `31 - 60`,
    ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), si.posting_date) BETWEEN 61 AND 90 THEN si.outstanding_amount ELSE 0 END), 2) AS `61 - 90`,
    ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), si.posting_date) BETWEEN 91 AND 120 THEN si.outstanding_amount ELSE 0 END), 2) AS `91 - 120`,
    ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), si.posting_date) > 120 THEN si.outstanding_amount ELSE 0 END), 2) AS `Above 120`

FROM `tabSales Invoice` si
JOIN `tabCustomer` c ON c.name = si.customer
WHERE si.docstatus = 1
  AND si.outstanding_amount > 0
  AND si.company = %(company)s
GROUP BY si.customer
ORDER BY c.customer_name;