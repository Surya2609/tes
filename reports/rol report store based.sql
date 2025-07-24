SELECT
    item.name AS `Item Code`,
    item.item_name AS `ITEM NAME`,
    -- item.custom_verity AS `Variety`,
    item.custom_handler_name AS `Handler`,
    -- item.custom_item_type AS `Type`,
    
    item.stock_uom AS `STOCK UOM`,
    -- item.custom_store_name AS `Store`,

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

   IFNULL(transit_summary.transit_qty, 0) AS `Transit Qty`,

    GREATEST((
        (
            SELECT IFNULL(SUM(warehouse_reorder_level), 0)
            FROM `tabItem Reorder`
            WHERE parent = item.name
        ) - IFNULL(transit_summary.transit_qty, 0)
    ), 0) AS `To Be Purchase`


FROM `tabItem` item

LEFT JOIN (
    SELECT
        asn_child.item,
        SUM(asn_child.stock_uom_qty) AS transit_qty
    FROM `tabAdvance Shipment Child` AS asn_child
    JOIN `tabAdvance Shipment Notice` AS asn ON asn.name = asn_child.parent
    WHERE asn.completed = 0
    GROUP BY asn_child.item
) AS transit_summary ON transit_summary.item = item.item_code

WHERE
    item.disabled = 0
    AND item.custom_store_name = %(store)s
    
    AND (
        SELECT IFNULL(SUM(warehouse_reorder_level), 0)
        FROM `tabItem Reorder`
        WHERE parent = item.name
    ) > (
        SELECT IFNULL(SUM(bin.actual_qty), 0)
        FROM `tabBin` bin
        JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
        WHERE bin.item_code = item.name
          AND wh.company = %(company)s
    )
    
    AND (
        SELECT IFNULL(SUM(warehouse_reorder_level), 0)
        FROM `tabItem Reorder` WHERE parent = item.name
    ) > 0

ORDER BY GREATEST((
    (
        SELECT IFNULL(SUM(warehouse_reorder_level), 0)
        FROM `tabItem Reorder`
        WHERE parent = item.name
    ) - IFNULL(transit_summary.transit_qty, 0)
), 0) DESC, `Item Code`
