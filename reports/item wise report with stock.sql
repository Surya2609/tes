SELECT
    so.company AS `Company`,
    item.item_code AS `Item Code`,
    item.item_name AS `Item Name`,
    item.gst_hsn_code AS `HSN Code`,
    item.custom_parent_group AS `Parent Group`,
    item.custom_sub_group_1 AS `Sub Group One`,
    item.custom_sub_group_2 AS `Sub Group Two`,
    item.custom_sub_group_3 AS `Sub Group Three`,
    item.stock_uom AS `Base UOM`,
    item.has_batch_no AS `Is Batch`,
    SUM(soi.qty) AS `SO Qty`,
    SUM(soi.qty - soi.delivered_qty) AS `SO Remaining Qty`,
    SUM(reorder.warehouse_reorder_level) AS `Reorder Level Qty`,
    SUM(reorder.warehouse_reorder_level) + SUM(soi.qty - soi.delivered_qty) AS `Total Qty`,
    SUM(bin.actual_qty) AS `Stock Available`,
   CASE 
    WHEN COUNT(poi.item_code) = 0 THEN 'N'
    ELSE CAST(SUM(
        CASE
            WHEN poi.received_qty IS NOT NULL THEN poi.qty - poi.received_qty
            ELSE poi.qty
        END
    ) AS CHAR)
END AS `PO Remaining Qty`,
    (SUM(reorder.warehouse_reorder_level) + SUM(soi.qty - soi.delivered_qty)) 
        - (SUM(bin.actual_qty) - SUM(
            CASE
                WHEN poi.received_qty IS NOT NULL THEN poi.qty - poi.received_qty
                ELSE poi.qty
            END
        )) AS `To be Purchase`,

   MAX(itax.tax_category) AS `Tax Template`,
    MAX(poi.rate) AS `Purchase Price`,
    MAX(po.currency) AS `Currency`
FROM
    `tabSales Order Item` AS soi
JOIN
    `tabSales Order` AS so ON so.name = soi.parent AND so.docstatus = 1 AND so.company = "MVD FASTENERS PRIVATE LIMITED"
LEFT JOIN
    `tabPurchase Order Item` AS poi ON poi.item_code = soi.item_code
LEFT JOIN
    `tabPurchase Order` AS po ON po.name = poi.parent AND po.docstatus = 1 AND po.company = "MVD FASTENERS PRIVATE LIMITED"
JOIN
    `tabItem` AS item ON item.item_code = soi.item_code
LEFT JOIN `tabItem Reorder` AS reorder ON reorder.parent = item.name
LEFT JOIN
    `tabBin` AS bin ON bin.item_code = item.item_code
LEFT JOIN 
    `tabItem Tax` AS itax ON itax.parent = item.name AND itax.parenttype = 'Item'
WHERE
    (%(item_code)s IS NULL OR item.item_code = %(item_code)s) AND
    (%(company)s IS NULL OR so.company = %(company)s)
GROUP BY
    so.company,
    item.item_code,
    item.item_name,
    item.gst_hsn_code,
    item.custom_parent_group,
    item.custom_sub_group_1,
    item.custom_sub_group_2,
    item.custom_sub_group_3,
    item.stock_uom,
    item.has_batch_no
ORDER BY
    item.item_code;