SELECT
    item.item_code AS `Item Code:Link/Item:150`,
    item.item_name AS `Item Name:Data:200`,

    bin_summary.`Warehouse Stock` AS `Warehouse Stock:Data:200`,
    IFNULL(reorder_summary.total_reorder_level, 0) AS `Reorder Level Qty:Float:120`,

    item.custom_sub_group_1 AS `Sub Group 1:Data:150`,
    item.custom_sub_group_2 AS `Sub Group 2:Data:150`,
    item.custom_sub_group_3 AS `Sub Group 3:Data:150`,

    IFNULL(item_price.price_list_rate, 0) AS `Standard Price:Currency:120`,

    -- ✅ Correct total stock only for selected company
    IFNULL(bin_filtered.total_qty, 0) AS `Total Stock:Float:120`,

    -- ✅ Stock Value = Standard Price * Total Stock
    ROUND(IFNULL(item_price.price_list_rate, 0) * IFNULL(bin_filtered.total_qty, 0), 2) AS `Stock Value:Currency:150`

FROM
    `tabItem` item

-- ✅ Total Stock subquery with company filter
LEFT JOIN (
    SELECT 
        b.item_code,
        SUM(b.actual_qty) AS total_qty
    FROM 
        `tabBin` b
    INNER JOIN `tabWarehouse` w ON w.name = b.warehouse
    WHERE 
        w.company = %(company)s
    GROUP BY 
        b.item_code
) AS bin_filtered ON bin_filtered.item_code = item.item_code

-- ✅ Warehouse breakdown subquery with company filter
LEFT JOIN (
    SELECT 
        b.item_code,
        GROUP_CONCAT(
            CONCAT(b.warehouse, ' (', ROUND(b.actual_qty, 2), ')')
            ORDER BY b.actual_qty DESC
            SEPARATOR ', '
        ) AS `Warehouse Stock`
    FROM 
        `tabBin` b
    INNER JOIN `tabWarehouse` w ON w.name = b.warehouse
    WHERE 
        w.company = %(company)s
        AND b.actual_qty > 0
    GROUP BY 
        b.item_code
) AS bin_summary ON bin_summary.item_code = item.item_code

-- ✅ Reorder level summary
LEFT JOIN (
    SELECT 
        parent AS item_code,
        SUM(warehouse_reorder_level) AS total_reorder_level
    FROM 
        `tabItem Reorder`
    GROUP BY 
        parent
) AS reorder_summary ON reorder_summary.item_code = item.item_code

-- ✅ Company price list
LEFT JOIN (
    SELECT 
        pl.name AS price_list_name,
        pl.custom_company
    FROM 
        `tabPrice List` pl
    WHERE 
        pl.custom_company = %(company)s
        AND pl.buying = 1
        AND pl.custom_stock = 1
    LIMIT 1
) AS price_list ON price_list.custom_company = %(company)s

-- ✅ Item price from selected price list
LEFT JOIN (
    SELECT 
        ip.item_code,
        ip.price_list,
        ip.price_list_rate
    FROM 
        `tabItem Price` ip
    WHERE 
        ip.buying = 1
) AS item_price ON 
    item_price.item_code = item.item_code
    AND item_price.price_list = price_list.price_list_name

WHERE
    item.disabled = 0

GROUP BY
    item.item_code,
    item.item_name,
    bin_summary.`Warehouse Stock`,
    reorder_summary.total_reorder_level,
    item.custom_sub_group_1,
    item.custom_sub_group_2,
    item.custom_sub_group_3,
    item_price.price_list_rate,
    bin_filtered.total_qty

ORDER BY
    item.item_code ASC;
