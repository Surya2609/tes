SELECT
    item.item_code AS "Item Code:Link/Item:150",
    item.item_name AS "Item Name:Data:200",
    item.stock_uom AS "UOM:Data:200",
    

    SUM(IFNULL(bin.actual_qty, 0)) AS "Total Stock:Float:120",

    IFNULL(item_price.price_list_rate, 0) AS "Price:Currency:120",
      ROUND(
        IFNULL(item_price.price_list_rate, 0) * SUM(IFNULL(bin.actual_qty, 0)),
        2
    ) AS "Stock Value:Currency:150",
     GROUP_CONCAT(
        IF(bin.actual_qty > 0 AND wh.company = %(company)s,
            CONCAT_WS('', wh.name, ' (', ROUND(bin.actual_qty, 2), ')'),
            NULL
        )
        ORDER BY wh.name
        SEPARATOR ', '
    ) AS "Location:Data:300"

FROM
    `tabItem` item
LEFT JOIN
    `tabBin` bin ON bin.item_code = item.item_code
LEFT JOIN
    `tabWarehouse` wh ON wh.name = bin.warehouse

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
        AND pl.enabled = 1
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
    AND wh.company = %(company)s
    AND bin.actual_qty > 0

GROUP BY
    item.item_code

HAVING
    SUM(IFNULL(bin.actual_qty, 0)) > 0