SELECT
    so_summary.company AS `Company`,
    item.item_code AS `Item Code`,
    item.item_name AS `Item Name`,
    item.gst_hsn_code AS `HSN Code`,
    item.custom_parent_group AS `Parent Group`,
    item.custom_sub_group_1 AS `Sub Group One`,
    item.custom_sub_group_2 AS `Sub Group Two`,
    item.custom_sub_group_3 AS `Sub Group Three`,
    item.stock_uom AS `Base UOM`,
    item.has_batch_no AS `Is Batch`,
    so_summary.so_qty AS `SO Qty`,
    so_summary.so_remaining_qty AS `SO Remaining Qty`,

    IFNULL(SUM(reorder.warehouse_reorder_level), 0) AS `Reorder Level Qty`,
    IFNULL(SUM(reorder.warehouse_reorder_level), 0) + so_summary.so_remaining_qty AS `Total Qty`,
    SUM(bin.actual_qty) AS `Stock Available`,

    TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM 
        CAST(IFNULL(po_summary.po_remaining_qty_in_base_uom, 0) AS CHAR)
    )) AS `PO Remaining Qty`,

    CASE
        WHEN 
            (SUM(IFNULL(reorder.warehouse_reorder_level, 0)) + so_summary.so_remaining_qty)
            - (SUM(IFNULL(bin.actual_qty, 0)) + IFNULL(po_summary.po_remaining_qty_in_base_uom, 0)) > 0
        THEN 
            (SUM(IFNULL(reorder.warehouse_reorder_level, 0)) + so_summary.so_remaining_qty)
            - (SUM(IFNULL(bin.actual_qty, 0)) + IFNULL(po_summary.po_remaining_qty_in_base_uom, 0))
        ELSE 0
    END AS `To be Purchase`,

    MAX(itax.tax_category) AS `Tax Template`,
    po_summary.rate AS `Purchase Price`,
    po_summary.currency AS `Currency`

FROM (
    SELECT
        so.company,
        soi.item_code,
        SUM(soi.stock_qty) AS so_qty,
        SUM(soi.stock_qty - soi.picked_qty) AS so_remaining_qty
    FROM
        `tabSales Order Item` AS soi
    JOIN
        `tabSales Order` AS so ON so.name = soi.parent AND so.docstatus = 1
    WHERE
        (%(company)s IS NULL OR so.company = %(company)s)
    GROUP BY
        so.company, soi.item_code
) AS so_summary

JOIN `tabItem` AS item ON item.item_code = so_summary.item_code
LEFT JOIN `tabItem Reorder` AS reorder ON reorder.parent = item.name
LEFT JOIN `tabBin` AS bin ON bin.item_code = item.item_code 

LEFT JOIN (
    SELECT
        poi.item_code,
        SUM((poi.qty - IFNULL(poi.received_qty, 0)) * IFNULL(ucd.conversion_factor, 1)) AS po_remaining_qty_in_base_uom,
        SUM(poi.qty) AS total_po_qty,
        SUM(IFNULL(poi.received_qty, 0)) AS total_received_qty,
        MAX(poi.rate) AS rate,
        MAX(po.currency) AS currency
    FROM `tabPurchase Order Item` AS poi
    JOIN `tabPurchase Order` AS po ON po.name = poi.parent AND po.docstatus = 1
    LEFT JOIN `tabUOM Conversion Detail` AS ucd ON ucd.parent = poi.item_code AND ucd.uom = poi.uom
    GROUP BY poi.item_code
) AS po_summary ON po_summary.item_code = item.item_code

LEFT JOIN `tabItem Tax` AS itax ON itax.parent = item.name AND itax.parenttype = 'Item'

GROUP BY
    so_summary.company,
    item.item_code,
    item.item_name,
    item.gst_hsn_code,
    item.custom_parent_group,
    item.custom_sub_group_1,
    item.custom_sub_group_2,
    item.custom_sub_group_3,
    item.stock_uom,
    item.has_batch_no,
    so_summary.so_qty,
    so_summary.so_remaining_qty,
    po_summary.po_remaining_qty_in_base_uom,
    po_summary.rate,
    po_summary.currency

HAVING `SO Remaining Qty` != 0

ORDER BY
    item.item_code;
