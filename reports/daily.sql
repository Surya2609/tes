SELECT
            so.customer_name,
            so.custom_order_status AS type,
            so.name AS sales_order,
            so.transaction_date AS so_date,
            soi.delivery_date AS delivery_date,
            soi.uom AS so_uom,
            soi.conversion_factor,
            soi.item_code,
            soi.item_name,
            itm.stock_uom AS uom,
            soi.qty,
            soi.rate,
            (IFNULL(soi.rate, 0) * IFNULL((soi.qty - IFNULL(delivered_data.delivered_qty, 0)), 0)) AS amount,

            IFNULL(bin_sum.actual_qty, 0) AS available_stock,
            (soi.qty - IFNULL(delivered_data.delivered_qty, 0)) AS so_uom_pending_qty,

            (soi.stock_qty - IFNULL(delivered_data.delivered_stock_qty, 0)) AS pending_qty

        FROM `tabSales Order` so
        JOIN `tabSales Order Item` soi ON soi.parent = so.name
            AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")
            
        LEFT JOIN (
    SELECT 
        dni.so_detail,
        SUM(dni.qty) AS delivered_qty,
        SUM(dni.stock_qty) AS delivered_stock_qty
    FROM `tabDelivery Note Item` dni
    JOIN `tabDelivery Note` dn ON dn.name = dni.parent
    WHERE dn.docstatus = 1
    GROUP BY dni.so_detail
) AS delivered_data ON delivered_data.so_detail = soi.name



        LEFT JOIN `tabItem` itm ON itm.name = soi.item_code
        LEFT JOIN (
            SELECT b.item_code, SUM(b.actual_qty) AS actual_qty
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON b.warehouse = w.name
            WHERE w.company = "MVD FASTENERS PRIVATE LIMITED"
            GROUP BY b.item_code
        ) AS bin_sum ON bin_sum.item_code = soi.item_code
        WHERE
            so.docstatus = 1 AND
            so.status != 'Closed' AND
            (so.custom_order_status IS NULL OR so.custom_order_status NOT IN ('NPD', 'Fore Cast')) AND
            so.company = "MVD FASTENERS PRIVATE LIMITED" AND
            (soi.qty - IFNULL(delivered_data.delivered_qty, 0)) > 0
        ORDER BY soi.delivery_date ASC