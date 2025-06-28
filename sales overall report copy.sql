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

    IFNULL(billed_data.billed_qty, 0) AS `Billed Qty`,
    (soi.qty - IFNULL(billed_data.billed_qty, 0)) AS `SO Pending Qty`,
    (soi.qty * soi.rate) AS `SO Order Value`,
    IFNULL(billed_data.billed_value, 0) AS `Billed Value`,
    (soi.qty * soi.rate - IFNULL(billed_data.billed_value, 0)) AS `Pending Value`,

    IFNULL(ir.warehouse_reorder_level, 0) AS `ROL`,
    IFNULL(bin_sum.actual_qty, 0) AS `Available Stock`,

    po_summary.custom_date AS `ETA DATE`,
    po_summary.pending_qty AS `ETA QTY`,
    po_summary.po_date AS `PO Date`

FROM `tabSales Order` so

JOIN `tabSales Order Item` soi ON soi.parent = so.name

LEFT JOIN `tabCustomer` cust ON cust.name = so.customer

LEFT JOIN (
    SELECT
        so_detail,
        SUM(qty) AS billed_qty,
        SUM(qty * rate) AS billed_value
    FROM `tabSales Invoice Item`
    WHERE docstatus = 1
    GROUP BY so_detail
) AS billed_data ON billed_data.so_detail = soi.name

LEFT JOIN (
    SELECT
        item_code,
        SUM(actual_qty) AS actual_qty
    FROM `tabBin`
    GROUP BY item_code
) AS bin_sum ON bin_sum.item_code = soi.item_code

LEFT JOIN (
    SELECT
        parent AS item_code,
        MAX(warehouse_reorder_level) AS warehouse_reorder_level
    FROM `tabItem Reorder`
    GROUP BY parent
) AS ir ON ir.item_code = soi.item_code

LEFT JOIN (
    SELECT
        latest_po.item_code AS item,
        (latest_po.qty - IFNULL(latest_po.received_qty, 0)) AS pending_qty,
        po.creation,
        po.transaction_date AS po_date,
        latest_po.custom_date
    FROM `tabPurchase Order Item` latest_po
    JOIN `tabPurchase Order` po ON latest_po.parent = po.name
    WHERE po.company = %(company)s
      AND po.docstatus = 1
      AND (latest_po.qty - IFNULL(latest_po.received_qty, 0)) > 0
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

WHERE
    so.docstatus = 1
    AND so.status NOT IN ('Cancelled')
    AND so.company = %(company)s
    AND so.transaction_date BETWEEN %(from_date)s AND %(to_date)s

ORDER BY
    so.transaction_date ASC;
