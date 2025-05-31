SELECT * FROM (
    SELECT
        item.name AS `Item Code`,
        item.item_name AS `ITEM NAME`,
        item.stock_uom AS `STOCK UOM`,

        IFNULL((
            SELECT SUM(bin.actual_qty)
            FROM `tabBin` bin
            JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
            WHERE bin.item_code = item.name
              AND wh.company = %(company)s
        ), 0) AS `AVAILABLE QTY`,

        IFNULL((
            SELECT SUM(warehouse_reorder_level)
            FROM `tabItem Reorder`
            WHERE parent = item.name
        ), 0) AS `REORDER QTY`,

        item.item_group AS `ITEM GROUP`,

        IFNULL((
            SELECT SUM(poi.qty - IFNULL(poi.received_qty, 0))
            FROM `tabPurchase Order Item` poi
            JOIN `tabPurchase Order` po ON poi.parent = po.name
            WHERE poi.item_code = item.name
              AND po.docstatus = 1
              AND po.status NOT IN ('Closed', 'Completed')
              AND po.company = %(company)s
        ), 0) AS `PO PENDING QTY`

    FROM
        `tabItem` item
    WHERE
        item.disabled = 0
) AS result
WHERE `AVAILABLE QTY` <= `REORDER QTY`
  AND `REORDER QTY` > 0
ORDER BY `Item Code`;
