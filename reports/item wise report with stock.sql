SELECT
    so_summary.company AS `Company`,
    item.item_code AS `Item Code`,
    item.item_name AS `Item Name`,
    item.custom_verity AS `variety`,
    item.custom_handler_name AS `Handler`,
    item.gst_hsn_code AS `HSN Code`,
    item.custom_parent_group AS `Parent Group`,
    item.custom_sub_group_1 AS `Sub Group One`,
    item.custom_sub_group_2 AS `Sub Group Two`,
    item.custom_sub_group_3 AS `Sub Group Three`,
    item.stock_uom AS `Base UOM`,
    item.has_batch_no AS `Is Batch`,
    so_summary.so_qty AS `SO Qty`,
    so_summary.so_remaining_qty AS `SO Remaining Qty`,

    IFNULL(reorder_summary.total_reorder_level, 0) AS `Reorder Level Qty`,
    IFNULL(reorder_summary.total_reorder_level, 0) + so_summary.so_remaining_qty AS `Total Qty`,
    SUM(IFNULL(bin.actual_qty, 0)) AS `Stock Available`,

    IFNULL(transit_summary.transit_qty, 0) AS `Transit Qty`,

    -- Final PO Remaining Qty = PO - Transit
    (
        IFNULL(po_summary.po_remaining_qty_in_base_uom, 0) - IFNULL(transit_summary.transit_qty, 0)
    ) AS `PO Remaining Qty`,

    -- To be Purchase = Total Qty - (Stock + PO Remaining Qty)
    CASE
        WHEN 
            (IFNULL(reorder_summary.total_reorder_level, 0) + so_summary.so_remaining_qty)
            - (SUM(IFNULL(bin.actual_qty, 0)) + IFNULL(transit_summary.transit_qty, 0) + 
               (IFNULL(po_summary.po_remaining_qty_in_base_uom, 0) - IFNULL(transit_summary.transit_qty, 0))) > 0
        THEN 
            (IFNULL(reorder_summary.total_reorder_level, 0) + so_summary.so_remaining_qty)
            - (SUM(IFNULL(bin.actual_qty, 0)) + IFNULL(transit_summary.transit_qty, 0) + 
               (IFNULL(po_summary.po_remaining_qty_in_base_uom, 0) - IFNULL(transit_summary.transit_qty, 0)))
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
        AND so.status != 'Closed'
        AND (
            so.custom_order_status NOT IN ('NPD')
            OR so.custom_order_status IS NULL
            OR so.custom_order_status = ''
        )
    GROUP BY
        so.company, soi.item_code
) AS so_summary

JOIN `tabItem` AS item ON item.item_code = so_summary.item_code

LEFT JOIN (
    SELECT 
        parent AS item_code,
        SUM(warehouse_reorder_level) AS total_reorder_level
    FROM `tabItem Reorder`
    GROUP BY parent
) AS reorder_summary ON reorder_summary.item_code = item.item_code

LEFT JOIN (
    SELECT bin.item_code, bin.warehouse, bin.actual_qty
    FROM `tabBin` bin
    JOIN `tabWarehouse` wh ON wh.name = bin.warehouse
    WHERE wh.company = %(company)s
) AS bin ON bin.item_code = item.item_code

LEFT JOIN (
    SELECT
        poi.item_code,
        SUM((poi.qty - IFNULL(poi.received_qty, 0)) * IFNULL(ucd.conversion_factor, 1)) AS po_remaining_qty_in_base_uom,
        MAX(poi.rate) AS rate,
        MAX(po.currency) AS currency
    FROM `tabPurchase Order Item` AS poi
    JOIN `tabPurchase Order` AS po ON po.name = poi.parent AND po.docstatus = 1
    LEFT JOIN `tabUOM Conversion Detail` AS ucd ON ucd.parent = poi.item_code AND ucd.uom = poi.uom
    WHERE po.company = %(company)s
    GROUP BY poi.item_code
) AS po_summary ON po_summary.item_code = item.item_code

LEFT JOIN `tabItem Tax` AS itax ON itax.parent = item.name AND itax.parenttype = 'Item'

LEFT JOIN (
    SELECT
        asn_child.item,
        SUM(asn_child.stock_uom_qty) AS transit_qty
    FROM `tabAdvance Shipment Child` AS asn_child
    JOIN `tabAdvance Shipment Notice` AS asn ON asn.name = asn_child.parent
    WHERE asn.completed = 0
    GROUP BY asn_child.item
) AS transit_summary ON transit_summary.item = item.item_code

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
    reorder_summary.total_reorder_level,
    po_summary.po_remaining_qty_in_base_uom,
    po_summary.rate,
    po_summary.currency,
    transit_summary.transit_qty

HAVING `SO Remaining Qty` != 0

ORDER BY item.item_code;
