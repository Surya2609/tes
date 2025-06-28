SELECT
    item.name AS `Item Code`,
    item.custom_item_type AS `Type`,
    item.item_name AS `ITEM NAME`,
    item.stock_uom AS `STOCK UOM`,

    -- Reorder Quantity
    (
        SELECT IFNULL(SUM(warehouse_reorder_level), 0)
        FROM `tabItem Reorder`
        WHERE parent = item.name
    ) AS `REORDER QTY`,

    -- Available Quantity
    (
        SELECT IFNULL(SUM(bin.actual_qty), 0)
        FROM `tabBin` bin
        JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
        WHERE bin.item_code = item.name
          AND wh.company = %(company)s
    ) AS `AVAILABLE QTY`,

    -- Status
    CASE
        WHEN (
            SELECT IFNULL(SUM(bin.actual_qty), 0)
            FROM `tabBin` bin
            JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
            WHERE bin.item_code = item.name AND wh.company = %(company)s
        ) = 0 THEN 'RED'
        WHEN (
            SELECT IFNULL(SUM(bin.actual_qty), 0)
            FROM `tabBin` bin
            JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
            WHERE bin.item_code = item.name AND wh.company = %(company)s
        ) < (
            SELECT IFNULL(SUM(warehouse_reorder_level), 0)
            FROM `tabItem Reorder` WHERE parent = item.name
        ) THEN 'YELLOW'
        ELSE 'GREEN'
    END AS `STATUS`,

    -- PO Pending Qty = ordered - received
    (
        SELECT IFNULL(SUM(poi.stock_qty - IFNULL(poi.received_qty, 0)), 0)
        FROM `tabPurchase Order Item` poi
        JOIN `tabPurchase Order` po ON poi.parent = po.name
        WHERE poi.item_code = item.name
          AND po.docstatus = 1
          AND po.status NOT IN ('Closed', 'Completed')
          AND po.company = %(company)s
    ) AS `PO PENDING QTY`,

    -- TO BE PURCHASED = reorder - available - po pending
    GREATEST(
        (
            IFNULL((
                SELECT SUM(warehouse_reorder_level)
                FROM `tabItem Reorder` WHERE parent = item.name
            ), 0)
            -
            IFNULL((
                SELECT SUM(bin.actual_qty)
                FROM `tabBin` bin
                JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
                WHERE bin.item_code = item.name AND wh.company = %(company)s
            ), 0)
            -
            IFNULL((
                SELECT SUM(poi.stock_qty - IFNULL(poi.received_qty, 0))
                FROM `tabPurchase Order Item` poi
                JOIN `tabPurchase Order` po ON poi.parent = po.name
                WHERE poi.item_code = item.name
                  AND po.docstatus = 1
                  AND po.status NOT IN ('Closed', 'Completed')
                  AND po.company = %(company)s
            ), 0)
        ),
        0
    ) AS `TO BE PURCHASED`

FROM `tabItem` item

WHERE
    item.disabled = 0
    AND (
        SELECT IFNULL(SUM(warehouse_reorder_level), 0)
        FROM `tabItem Reorder` WHERE parent = item.name
    ) > 0

ORDER BY `Item Code`;
