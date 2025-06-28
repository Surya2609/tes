WITH 
ReorderQty AS (
    SELECT parent AS item_code, SUM(warehouse_reorder_level) AS reorder_qty
    FROM `tabItem Reorder`
    GROUP BY parent
),
AvailableQty AS (
    SELECT bin.item_code, SUM(bin.actual_qty) AS available_qty
    FROM `tabBin` bin
    JOIN `tabWarehouse` wh ON bin.warehouse = wh.name
    WHERE wh.company = %(company)s
    GROUP BY bin.item_code
),
StatusData AS (
    SELECT
        item.name AS item_code,
        COALESCE(rq.reorder_qty, 0) AS reorder_qty,
        COALESCE(aq.available_qty, 0) AS available_qty,
        CASE
            WHEN COALESCE(aq.available_qty, 0) = 0 THEN 'RED'
            WHEN COALESCE(aq.available_qty, 0) < COALESCE(rq.reorder_qty, 0) THEN 'YELLOW'
            ELSE 'GREEN'
        END AS status
    FROM `tabItem` item
    LEFT JOIN ReorderQty rq ON rq.item_code = item.name
    LEFT JOIN AvailableQty aq ON aq.item_code = item.name
    WHERE item.disabled = 0
      AND item.custom_item_type = 'Import'
      AND COALESCE(rq.reorder_qty, 0) > 0
)

SELECT
    status AS `Status`,
    COUNT(*) AS `Count`
FROM StatusData
GROUP BY status
