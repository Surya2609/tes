WITH
    sales_order_pending AS (
        SELECT
    so.customer_name AS `Customer Name`,
    cust.custom_customer_new_id AS `Customer Grade`,
    cust.custom_sales_person_id AS `Sales Person ID`,
    so.name AS `Sales Order`,
    so.transaction_date AS `SO Date`,
    so.delivery_date AS `SO Due Date`,
    
    soi.item_code AS `Item Code`,
    soi.item_name AS `Item Name`,
    soi.custom_customer_part_code AS `Customer Part Code`,
    soi.custom_customer_description AS `Customer Description`,
    soi.qty AS `Order Qty`,

    IFNULL(billed_all.billed_qty, 0) AS `Billed Qty`,
    (soi.qty - IFNULL(billed_all.billed_qty, 0)) AS `SO Pending Qty`,
    (soi.qty * soi.rate) AS `SO Order Value`,
    IFNULL(billed_all.billed_value, 0) AS `Billed Value`,
    (soi.qty * soi.rate - IFNULL(billed_all.billed_value, 0)) AS `Pending Value`,

    IFNULL(ir.warehouse_reorder_level, 0) AS `ROL`,
    IFNULL(bin_sum.actual_qty, 0) AS `Available Stock`,

    po_summary.custom_date AS `ETA DATE`,
    po_summary.pending_qty AS `ETA QTY`,
    po_summary.po_date AS `PO Date`,

    'SO Pending' AS `Type`

FROM `tabSales Order` so
JOIN `tabSales Order Item` soi ON soi.parent = so.name
LEFT JOIN `tabCustomer` cust ON cust.name = so.customer

-- Total billing (lifetime)
LEFT JOIN (
    SELECT
        so_detail,
        SUM(qty) AS billed_qty,
        SUM(qty * rate) AS billed_value
    FROM `tabSales Invoice Item`
    WHERE docstatus = 1
    GROUP BY so_detail
) AS billed_all ON billed_all.so_detail = soi.name

LEFT JOIN (
    SELECT item_code, SUM(actual_qty) AS actual_qty
    FROM `tabBin` GROUP BY item_code
) AS bin_sum ON bin_sum.item_code = soi.item_code

LEFT JOIN (
    SELECT parent AS item_code, MAX(warehouse_reorder_level) AS warehouse_reorder_level
    FROM `tabItem Reorder` GROUP BY parent
) AS ir ON ir.item_code = soi.item_code


LEFT JOIN (
    SELECT
        latest_po.item_code AS item,
        (latest_po.qty - IFNULL(latest_po.received_qty, 0)) AS pending_qty,
        po.transaction_date AS po_date,
        latest_po.custom_date
    FROM `tabAdvance Shipment Child` ascc
    JOIN `tabAdvance Shipment Notice` asn ON ascc.parent = po.name
    WHERE asn.company = %(company)s
        AND (asn.qty - IFNULL(latest_po.received_qty, 0)) > 0
        AND po.creation = (
            SELECT MAX(po2.creation)
            FROM `tabPurchase Order Item` poi2
            JOIN `tabPurchase Order` po2 ON poi2.parent = po2.name
            WHERE poi2.item_code = latest_po.item_code
                AND po2.company = %(company)s
                AND po2.docstatus = 1
                AND (poi2.qty - IFNULL(poi2.received_qty, 0)) > 0
        )
) AS po_summary ON soi.item_code = po_summary.item


-- LEFT JOIN (
--     SELECT
--         latest_po.item_code AS item,
--         (latest_po.qty - IFNULL(latest_po.received_qty, 0)) AS pending_qty,
--         po.transaction_date AS po_date,
--         latest_po.custom_date
--     FROM `tabPurchase Order Item` latest_po
--     JOIN `tabPurchase Order` po ON latest_po.parent = po.name
--     WHERE po.company = %(company)s
--         AND po.docstatus = 1
--         AND (latest_po.qty - IFNULL(latest_po.received_qty, 0)) > 0
--         AND po.creation = (
--             SELECT MAX(po2.creation)
--             FROM `tabPurchase Order Item` poi2
--             JOIN `tabPurchase Order` po2 ON poi2.parent = po2.name
--             WHERE poi2.item_code = latest_po.item_code
--                 AND po2.company = %(company)s
--                 AND po2.docstatus = 1
--                 AND (poi2.qty - IFNULL(poi2.received_qty, 0)) > 0
--         )
-- ) AS po_summary ON soi.item_code = po_summary.item


WHERE
    so.docstatus = 1
    AND so.status NOT IN ('Cancelled')
    AND so.company = %(company)s
    AND (soi.qty - IFNULL(billed_all.billed_qty, 0)) > 0

    ),
-- Part 2: This month's billed qty view (no filtering on SO pending)

 billing_on_date AS (
SELECT
    so.customer_name AS `Customer Name`,
    cust.custom_customer_new_id AS `Customer Grade`,
    cust.custom_sales_person_id AS `Sales Person ID`,
    so.name AS `Sales Order`,
    so.transaction_date AS `SO Date`,
    so.delivery_date AS `SO Due Date`,
    
    soi.item_code AS `Item Code`,
    soi.item_name AS `Item Name`,
    soi.custom_customer_part_code AS `Customer Part Code`,
    soi.custom_customer_description AS `Customer Description`,
    soi.qty AS `Order Qty`,

    IFNULL(billed_month.billed_qty, 0) AS `Billed Qty`,
    NULL AS `SO Pending Qty`,
    (soi.qty * soi.rate) AS `SO Order Value`,
    IFNULL(billed_month.billed_value, 0) AS `Billed Value`,
    NULL AS `Pending Value`,

    NULL AS `ROL`,
    NULL AS `Available Stock`,

    NULL AS `ETA DATE`,
    NULL AS `ETA QTY`,
    NULL AS `PO Date`,

    'Monthly Billing' AS `Type`

FROM `tabSales Order` so
JOIN `tabSales Order Item` soi ON soi.parent = so.name
LEFT JOIN `tabCustomer` cust ON cust.name = so.customer

-- Billed only this month
LEFT JOIN (
    SELECT
        sii.so_detail,
        SUM(sii.qty) AS billed_qty,
        SUM(sii.qty * sii.rate) AS billed_value
    FROM `tabSales Invoice Item` sii
    JOIN `tabSales Invoice` si ON sii.parent = si.name
    WHERE si.docstatus = 1
      AND si.posting_date BETWEEN %(from_date)s AND %(to_date)s
    GROUP BY sii.so_detail
) AS billed_month ON billed_month.so_detail = soi.name

WHERE
    so.docstatus = 1
    AND so.status NOT IN ('Cancelled')
    AND so.company = %(company)s
    AND billed_month.so_detail IS NOT NULL

    )

SELECT * FROM sales_order_pending
UNION ALL
SELECT * FROM billing_on_date;