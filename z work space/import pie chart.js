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
StockCoverage AS (
    SELECT
        item.name AS item_code,
        COALESCE(aq.available_qty, 0) AS available_qty,
        COALESCE(rq.reorder_qty, 0) AS reorder_qty,
        CASE
            WHEN COALESCE(rq.reorder_qty, 0) = 0 THEN NULL
            ELSE ROUND((COALESCE(aq.available_qty, 0) / rq.reorder_qty) * 100, 2)
        END AS coverage_percent
    FROM `tabItem` item
    LEFT JOIN ReorderQty rq ON rq.item_code = item.name
    LEFT JOIN AvailableQty aq ON aq.item_code = item.name
    WHERE item.disabled = 0
      AND item.custom_item_type = 'Local'
      AND COALESCE(rq.reorder_qty, 0) > 0
),
CoverageBands AS (
    SELECT
        item_code,
        coverage_percent,
        CASE
            WHEN coverage_percent IS NULL THEN 'No ROL'
            WHEN coverage_percent = 0 THEN '0'
            WHEN coverage_percent > 100 THEN 'Above 100'
            WHEN coverage_percent > 66 THEN '66 - 100'
            WHEN coverage_percent > 33 THEN '33 - 66'
            ELSE '0 - 33'
        END AS band
    FROM StockCoverage
)

SELECT
    band AS `Coverage Band`,
    COUNT(*) AS `Count`
FROM CoverageBands
GROUP BY band
ORDER BY 
   CASE 
     WHEN band = '0' THEN 1
     WHEN band = '0 - 33' THEN 2
     WHEN band = '33 - 66' THEN 3
     WHEN band = '66 - 100' THEN 4
     WHEN band = 'Above 100' THEN 5
     ELSE 6
   END;
