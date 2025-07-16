import frappe

def execute(filters=None):
    company = filters.get("company")
    warehouse = filters.get("warehouse")

    columns = [
        {"label": "Delivery Date", "fieldname": "delivery_date", "fieldtype": "Data", "width": 115},
        {"label": "ROL", "fieldname": "rol_qty", "fieldtype": "Data", "width": 80},
        {"label": "Sales Order", "fieldname": "sales_order", "fieldtype": "Link", "options": "Sales Order", "width": 140},
        # {"label": "Customer Code", "fieldname": "customer", "fieldtype": "Link", "options": "Customer", "width": 140},
        {"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Data", "width": 140},
                        
        # {"label": "CF", "fieldname": "c_f", "fieldtype": "Data", "width": 100},
        
        {"label": "Item Code", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 140},
        {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 180},        
        # {"label": "SO Qty", "fieldname": "so_uom_qty", "fieldtype": "Float", "width": 100},
        
        {"label": "Available Stock", "fieldname": "available_stock", "fieldtype": "Float", "width": 120},
        # {"label": "Stock by Warehouse", "fieldname": "stock_by_warehouse", "fieldtype": "Data", "width": 250},
        # {"label": "Pending Qty", "fieldname": "pending_qty", "fieldtype": "Float", "width": 120},
        # {"label": "Total Picked Qty", "fieldname": "total_picked_qty", "fieldtype": "Float", "width": 120},
        
        # {"label": "Current Pending Qty", "fieldname": "current_pending_qty", "fieldtype": "Float", "width": 140},
        # {"label": "Base UOM", "fieldname": "base_uom", "fieldtype": "Data", "width": 100},
        
        {"label": "Pending Qty", "fieldname": "current_so_uom_pending_qty", "fieldtype": "Float", "width": 140},
        {"label": "UOM", "fieldname": "so_uom", "fieldtype": "Data", "width": 100},
        
        # {"label": "To Pick Qty", "fieldname": "to_pick_qty", "fieldtype": "Float", "width": 120},
        {"label": "Action", "fieldname": "action", "fieldtype": "HTML", "width": 180},
        {"label": "View", "fieldname": "view", "fieldtype": "HTML", "width": 100},
    ]

    sql = """
        WITH warehouse_tree AS (
        SELECT lft, rgt FROM tabWarehouse WHERE name = %(warehouse)s LIMIT 1
    ),
    item_stock AS (
        SELECT
            b.item_code,
            SUM(b.actual_qty) AS available_stock,
            GROUP_CONCAT(CONCAT(b.warehouse, ': ', b.actual_qty) SEPARATOR ', ') AS stock_by_warehouse
        FROM tabBin b
        JOIN tabWarehouse w ON b.warehouse = w.name
        JOIN warehouse_tree wt ON w.lft >= wt.lft AND w.rgt <= wt.rgt
        WHERE w.name != 'Picking - MVDF'  -- 👈 Exclude this specific warehouse
        GROUP BY b.item_code
    )
    kot_data AS (
        SELECT 
            sales_order,
            item_code,
            so_detail,
            SUM(IFNULL(so_qty, 0)) AS so_qty,
            SUM(IFNULL(total_picked_qty, 0)) AS total_picked_qty,
            SUM(IFNULL(kot_qty, 0)) AS kot_qty
        FROM tabKOT Report
        GROUP BY sales_order, item_code, so_detail
    )

    SELECT
        so.company,
        so.name AS sales_order,
        soi.delivery_date AS delivery_date,
        so.customer AS customer,
        so.customer_name AS customer_name,
        soi.uom AS so_uom,
        itm.stock_uom AS base_uom,
        soi.item_code,
        soi.item_name,
        soi.conversion_factor AS c_f,
        soi.qty AS so_uom_qty,
        soi.stock_qty AS so_qty,
        rol.rol_qty AS rol_qty,        

        IFNULL(stock.available_stock, 0) AS available_stock,
        IFNULL(stock.stock_by_warehouse, 'No Stock') AS stock_by_warehouse,

        (soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) AS pending_qty,

        (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0)) AS total_picked_qty,

        ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - 
        (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0))) AS current_pending_qty,

        ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - 
        (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0))) / soi.conversion_factor AS current_so_uom_pending_qty,

        0 AS to_pick_qty,

        CONCAT(
            '<button class="btn btn-primary kot-create" ',
            'data-so="', so.name, '" ',
            'data-warehouse="', itm.custom_store_name, '" ',
            'data-so_uom="', soi.uom , '" ',
            'data-so_detail="', soi.name , '" ',
            'data-base_uom="', itm.stock_uom , '" ',
            'data-c_f="', soi.conversion_factor , '" ',
            'data-pending_qty="', (soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)), '" ',
            'data-company="', %(company)s, '" ',
            'data-item="', soi.item_code, '" ',
            'data-name="', REPLACE(REPLACE(itm.item_name, CHAR(39), '%%27'), '"', '%%22'), '" ',
            'data-so_qty="', soi.stock_qty, '" ',
            'data-kot_qty="0" ',
            '>Confirm</button>'
        ) AS action,

        CONCAT(
            '<button class="btn btn-dark warehouse-show" ',
            'data-warehouse="', 
            IFNULL((
                SELECT GROUP_CONCAT(CONCAT(b.warehouse, ': ', b.actual_qty) SEPARATOR ', ')
                FROM tabBin b
                JOIN tabWarehouse w ON b.warehouse = w.name
                JOIN (
                    SELECT lft, rgt FROM tabWarehouse
                    WHERE name = %(warehouse)s LIMIT 1
                ) AS parent_w ON w.lft >= parent_w.lft AND w.rgt <= parent_w.rgt
                WHERE b.item_code = soi.item_code
                AND b.actual_qty > 0
                AND w.name != 'Picking - MVDF'  -- ❌ Exclude this warehouse
            ), ''), '" ',
            'data-base_uom="', IFNULL(itm.stock_uom, ''), '" ',
            'data-so_uom="', IFNULL(soi.uom, ''), '" ',
            'data-cf="', IFNULL(soi.conversion_factor, 1), '" ',
            '>View</button>'
        ) AS view

    FROM tabSales Order so

    JOIN tabSales Order Item soi ON soi.parent = so.name
        AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")

    LEFT JOIN item_stock stock ON stock.item_code = soi.item_code

    LEFT JOIN (
        SELECT parent AS item_code, SUM(warehouse_reorder_level) AS rol_qty
        FROM tabItem Reorder
        GROUP BY parent
    ) rol ON rol.item_code = soi.item_code

    LEFT JOIN (
        SELECT 
            dni.so_detail,
            SUM(dni.qty) AS delivered_qty,
            SUM(dni.stock_qty) AS delivered_stock_qty
        FROM tabDelivery Note Item dni
        JOIN tabDelivery Note dn ON dn.name = dni.parent
        WHERE dn.docstatus = 1 AND dn.is_return != 1
        GROUP BY dni.so_detail
    ) delivered ON delivered.so_detail = soi.name

    LEFT JOIN tabItem itm ON itm.name = soi.item_code

    LEFT JOIN kot_data kot ON kot.sales_order = so.name AND kot.item_code = soi.item_code AND kot.so_detail = soi.name

    WHERE
        so.docstatus = 1
        AND so.status NOT IN ('Closed', 'Cancelled')
        AND (so.custom_order_status IS NULL OR so.custom_order_status NOT IN ('NPD', 'Fore Cast'))
        AND so.company = %(company)s
        AND (soi.qty - IFNULL(delivered.delivered_qty, 0)) > 0
        AND itm.custom_store_name = 'KRISHNA'
        AND soi.delivery_date <= CURDATE()
        AND (
            kot.so_qty IS NULL OR
            ABS(kot.so_qty - (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0))) > 0.001
        )
        AND (
            ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - 
            (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0))) != 0
        )

    ORDER BY soi.delivery_date ASC;

    """

    raw_data = frappe.db.sql(sql, {"company": company, "warehouse": warehouse}, as_dict=True)


    stock_tracker = {}
    for row in raw_data:
        item = row["item_code"]
        curr_pending = row["current_pending_qty"]
        stock = row["available_stock"]

        if item not in stock_tracker:
            stock_tracker[item] = stock

        remaining_stock = stock_tracker[item]

        to_pick = min(curr_pending, remaining_stock)
        row["available_stock"] = remaining_stock
        row["to_pick_qty"] = to_pick

        row["action"] = row["action"].replace('data-kot_qty="0"', f'data-kot_qty="{to_pick}"')

        stock_tracker[item] -= to_pick
        
        tol_len_items = len(raw_data)
        unique_sales_orders = len(set(row["sales_order"] for row in raw_data))
        unique_customers = len(set(row["customer"] for row in raw_data))
        total_pending_qty = sum(row.get("current_pending_qty", 0) for row in raw_data)

        # Count colors
        green_count = 0
        orange_count = 0
        red_count = 0

        for row in raw_data:
            to_pick = row.get("to_pick_qty", 0)
            pending = row.get("current_pending_qty", 0)

            if to_pick == 0:
                red_count += 1
            elif to_pick < pending:
                orange_count += 1
            elif to_pick == pending:
                green_count += 1

        message = [f"""
        <!-- First row: summary -->
        <div style='
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 12px;
        '>
            <div style='flex: 1; font-size:22px; font-weight:bold; color:#383d41; background-color:#e2e3e5; padding:12px; border-radius:8px; min-width:200px;'>
                ✅ Total Items Pending: <span style='color:#c82333;'>00{tol_len_items}</span>
            </div>
            <div style='flex: 1; font-size:22px; font-weight:bold; color:#383d41; background-color:#e2e3e5; padding:12px; border-radius:8px; min-width:200px;'>
                📄 Total SOs Pending: <span style='color:#c82333;'>00{unique_sales_orders}</span>
            </div>
            <div style='flex: 1; font-size:22px; font-weight:bold; color:#383d41; background-color:#e2e3e5; padding:12px; border-radius:8px; min-width:200px;'>
                🧑‍🤝‍🧑 Total Customers: <span style='color:#c82333;'>00{unique_customers}</span>
            </div>
            <div style='flex: 1; font-size:22px; font-weight:bold; color:#383d41; background-color:#e2e3e5; padding:12px; border-radius:8px; min-width:200px;'>
                📦 Total Pending Qty: <span style='color:#c82333;'>{total_pending_qty:.2f}</span>
            </div>
        </div>

        <!-- Second row: color-coded stats -->
        <div style='
            display: flex;
            gap: 16px;
        '>
            <div style='flex:1; font-size:20px; font-weight:bold; color:#155724; background-color:#d4edda; padding:10px; border-radius:8px; min-width:200px;'>
                🟩 Available Stock: <span style='color:#c82333;'>{green_count}</span>
            </div>
            <div style='flex:1; font-size:20px; font-weight:bold; color:#856404; background-color:#fff3cd; padding:10px; border-radius:8px; min-width:200px;'>
                🟧 Partial Stock: <span style='color:#c82333;'>{orange_count}</span>
            </div>
            <div style='flex:1; font-size:20px; font-weight:bold; color:#721c24; background-color:#f8d7da; padding:10px; border-radius:8px; min-width:200px;'>
                🟥 No Stock: <span style='color:#c82333;'>{red_count}</span>
            </div>
        </div>
        """]


    return columns, raw_data, message