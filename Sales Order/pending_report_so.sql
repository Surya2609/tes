SELECT
    so.name AS `Sales Order No`,
    so.transaction_date AS `SO Date`,
    so.delivery_date AS `Required By Date`,
    so.po_date AS `Customer PO Date`,
    so.po_no AS `Customer PO Number`,
    so.customer AS `Customer`,
    so.customer_name AS `Customer Name`,
    soi.item_code AS `Item Code`,
    soi.item_name AS `Item Name`,
    soi.qty AS `Order Qty`,
    (soi.qty - IFNULL(soi.delivered_qty, 0)) AS `Quantity to Deliver`,
    (soi.rate * (soi.qty - IFNULL(soi.delivered_qty, 0))) AS `Pending Amount`,
    GROUP_CONCAT(
        CONCAT(bin.warehouse, ' (', FORMAT(IFNULL(bin.actual_qty, 0), 1), ')')
        ORDER BY bin.warehouse ASC
        SEPARATOR '\n'
    ) AS `Warehouse`
FROM
    `tabSales Order` AS so
JOIN
    `tabSales Order Item` AS soi ON so.name = soi.parent
LEFT JOIN
    `tabBin` AS bin ON bin.item_code = soi.item_code 
        AND bin.actual_qty > 0 -- ✅ Only include positive stock
LEFT JOIN
    `tabCustomer` AS cust ON so.customer = cust.name
WHERE
    so.status NOT IN ('Completed', 'Closed')
GROUP BY
    so.name, so.po_no, cust.customer_group, soi.item_code, soi.qty, soi.delivered_qty, soi.rate
HAVING
    `Quantity to Deliver` > 0
ORDER BY
    so.transaction_date DESC