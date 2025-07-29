import frappe

def execute(filters=None):
    company = filters.get("company")
    warehouse = filters.get("warehouse")

    columns = [
        {"label": "Delivery Date", "fieldname": "delivery_date", "fieldtype": "Data", "width": 115},
        # {"label": "ISLOCKED", "fieldname": "is_lock", "fieldtype": "Data", "width": 40},
        {"label": "ROL", "fieldname": "rol_qty", "fieldtype": "Data", "width": 80},
        {"label": "Sales Order", "fieldname": "sales_order", "fieldtype": "Link", "options": "Sales Order", "width": 180},    
        # {"label": "Customer Code", "fieldname": "customer", "fieldtype": "Link", "options": "Customer", "width": 140},
        {"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Data", "width": 190},

        # {"label": "CF", "fieldname": "c_f", "fieldtype": "Data", "width": 100},

        {"label": "Item Code", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 500},
        # {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 140},
                
        {"label": "SO Qty", "fieldname": "so_uom_qty", "fieldtype": "Float", "width": 100},
        {"label": "Total Count SO Items", "fieldname": "total_lines", "fieldtype": "Float", "width": 100},
        {"label": "Dispached Count", "fieldname": "fully_dispatched_lines", "fieldtype": "Float", "width": 100},

        # {"label": "Picked Qty", "fieldname": "picked_qtyy", "fieldtype": "Float", "width": 100},
        # {"label": "Delivered Qty", "fieldname": "dn_qty", "fieldtype": "Float", "width": 100},

        {"label": "Available Stock", "fieldname": "available_stock", "fieldtype": "Float", "width": 120},


        # {"label": "Stock by Warehouse", "fieldname": "stock_by_warehouse", "fieldtype": "Data", "width": 250},
        # {"label": "Pending Qty", "fieldname": "pending_qty", "fieldtype": "Float", "width": 120},
        # {"label": "Total Picked Qty", "fieldname": "total_picked_qty", "fieldtype": "Float", "width": 120},
        # {"label": "Current Pending Qty", "fieldname": "pl_current_pending_qty", "fieldtype": "Float", "width": 140},
        # {"label": "Base UOM", "fieldname": "base_uom", "fieldtype": "Data", "width": 100},
        # {"label": "Picked Pending Qty", "fieldname": "pl_current_so_uom_pending_qty", "fieldtype": "Float", "width": 100},


        {"label": "Pending Qty", "fieldname": "dn_current_so_uom_pending_qty", "fieldtype": "Float", "width": 100},

        {"label": "UOM", "fieldname": "so_uom", "fieldtype": "Data", "width": 50},

        # {"label": "To Pick Qty", "fieldname": "to_pick_qty", "fieldtype": "Float", "width": 120},

        {"label": "Action", "fieldname": "action", "fieldtype": "HTML", "width": 80},
        {"label": "View", "fieldname": "view", "fieldtype": "HTML", "width": 70},
        {"label": "KOT Stock", "fieldname": "kot_stock_qty", "fieldtype": "Float", "width": 100},
        {"label": "Platting Stock", "fieldname": "platting_stock_qty", "fieldtype": "Float", "width": 100},

    ]

    sql = """
    WITH
        warehouse_tree AS (
            SELECT lft, rgt FROM tabWarehouse WHERE name = %(warehouse)s LIMIT 1
        ),
        exclude_picking AS (
            SELECT lft, rgt FROM tabWarehouse WHERE name = 'Picking - MVDF' LIMIT 1
        ),
    item_stock AS (
            SELECT
                b.item_code,
                SUM(b.actual_qty) AS available_stock,
                GROUP_CONCAT(CONCAT(b.warehouse, ': ', b.actual_qty) SEPARATOR ', ') AS stock_by_warehouse
            FROM tabBin b
            JOIN tabWarehouse w ON b.warehouse = w.name
            JOIN warehouse_tree wt ON w.lft >= wt.lft AND w.rgt <= wt.rgt
            LEFT JOIN exclude_picking ep ON w.lft >= ep.lft AND w.rgt <= ep.rgt
            WHERE ep.lft IS NULL  -- ❌ exclude Picking - MVDF and its children
            GROUP BY b.item_code
    ),
    kot_data AS (
        SELECT 
            sales_order,
            item_code,
            so_detail,
            SUM(IFNULL(so_qty, 0)) AS so_qty,
            SUM(IFNULL(total_picked_qty, 0)) AS total_picked_qty,
            SUM(IFNULL(kot_qty, 0)) AS kot_qty
        FROM `tabKOT Report`
        GROUP BY sales_order, item_code, so_detail
    ),

    platting_stock AS (
        SELECT
            b.item_code,
            SUM(b.actual_qty) AS platting_stock_qty
        FROM tabBin b
        JOIN tabWarehouse w ON b.warehouse = w.name
        JOIN (
            SELECT lft, rgt FROM tabWarehouse WHERE name = 'Non Moving Warehouse - MVDF' LIMIT 1
        ) parent_w ON w.lft >= parent_w.lft AND w.rgt <= parent_w.rgt
        GROUP BY b.item_code
    ),
    so_dispatch_status AS (
        SELECT
            parent AS sales_order,
            COUNT(*) AS total_lines,
            SUM(
                CASE 
                    WHEN IFNULL(delivered_qty, 0) + IFNULL(returned_qty, 0) >= qty THEN 1
                    ELSE 0
                END
            ) AS fully_dispatched_lines
        FROM `tabSales Order Item`
        GROUP BY parent
    ),


    kot_stock AS (
        SELECT
            b.item_code,
            SUM(b.actual_qty) AS kot_stock_qty
        FROM tabBin b
        JOIN tabWarehouse w ON b.warehouse = w.name
        JOIN (
            SELECT lft, rgt FROM tabWarehouse WHERE name = 'Picking - MVDF' LIMIT 1
        ) parent_w ON w.lft >= parent_w.lft AND w.rgt <= parent_w.rgt
        GROUP BY b.item_code
    )

    SELECT
        so.company,             
        so.name AS sales_order,
        cust.custom_locked AS is_lock,
        so.customer AS customer,
        soi.delivery_date AS delivery_date,
        so.customer_name AS customer_name,
        soi.uom AS so_uom,
        itm.stock_uom AS base_uom,
        soi.item_code,
        soi.item_name,
        soi.conversion_factor AS c_f,
        soi.qty AS so_uom_qty,
        soi.stock_qty AS so_qty,
        rol.rol_qty AS rol_qty, 
        sds.total_lines,
        sds.fully_dispatched_lines,
        picked.picked_qty AS picked_qtyy,
        IFNULL(kot_stock.kot_stock_qty, 0) AS kot_stock_qty,
        IFNULL(platting_stock.platting_stock_qty, 0) AS platting_stock_qty,

        IFNULL(stock.available_stock, 0) AS available_stock,
        IFNULL(stock.stock_by_warehouse, 'No Stock') AS stock_by_warehouse,

        (IFNULL(kot.total_picked_qty, 0) + IFNULL(kot.kot_qty, 0)) AS total_picked_qty,

        delivered.delivered_qty  AS dn_qty,

        (soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) AS dn_pending_qty,

        ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - 
        IFNULL(kot.kot_qty, 0)) AS dn_current_pending_qty,

        ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - 
        IFNULL(kot.kot_qty, 0)) / soi.conversion_factor AS dn_current_so_uom_pending_qty,



        (soi.stock_qty - IFNULL(picked.picked_stock_qty, 0)) AS pending_qty,

        ((soi.stock_qty - IFNULL(picked.picked_stock_qty, 0)) - 
        IFNULL(kot.kot_qty, 0)) AS pl_current_pending_qty,

        ((soi.stock_qty - IFNULL(picked.picked_stock_qty, 0)) - 
        IFNULL(kot.kot_qty, 0)) / soi.conversion_factor AS pl_current_so_uom_pending_qty,


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
                AND NOT EXISTS (
                    SELECT 1 FROM tabWarehouse ex
                    WHERE ex.name = 'Picking - MVDF'
                        AND w.lft >= ex.lft AND w.rgt <= ex.rgt
                )
            ), ''), '" ',
            'data-base_uom="', IFNULL(itm.stock_uom, ''), '" ',
            'data-so_uom="', IFNULL(soi.uom, ''), '" ',
            'data-cf="', IFNULL(soi.conversion_factor, 1), '" ',
            '>View</button>'
        ) AS view

    FROM `tabSales Order` so

    JOIN `tabSales Order Item` soi ON soi.parent = so.name
        AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")

    LEFT JOIN item_stock stock ON stock.item_code = soi.item_code

    LEFT JOIN tabCustomer cust ON cust.name = so.customer

    LEFT JOIN so_dispatch_status sds ON sds.sales_order = so.name

    LEFT JOIN (
        SELECT parent AS item_code, SUM(warehouse_reorder_level) AS rol_qty
        FROM `tabItem Reorder`
        GROUP BY parent
    ) rol ON rol.item_code = soi.item_code

    LEFT JOIN (
        SELECT 
            pli.sales_order_item AS so_detail,
            SUM(pli.qty) AS picked_qty,
            SUM(pli.qty * IFNULL(soi.conversion_factor, 1)) AS picked_stock_qty
        FROM `tabPick List Item` pli
        JOIN `tabPick List` pl ON pl.name = pli.parent
        JOIN `tabSales Order Item` soi ON soi.name = pli.sales_order_item
        WHERE pl.docstatus = 1
        GROUP BY pli.sales_order_item
    ) picked ON picked.so_detail = soi.name


    LEFT JOIN (
        SELECT 
            dni.so_detail,
            SUM(dni.qty) AS delivered_qty,
            SUM(dni.stock_qty) AS delivered_stock_qty
        FROM `tabDelivery Note Item` dni
        JOIN `tabDelivery Note` dn ON dn.name = dni.parent
        WHERE dn.docstatus = 1 AND dn.is_return != 1
        GROUP BY dni.so_detail
    ) delivered ON delivered.so_detail = soi.name

    LEFT JOIN `tabItem` itm ON itm.name = soi.item_code

    LEFT JOIN kot_data kot ON kot.sales_order = so.name AND kot.item_code = soi.item_code AND kot.so_detail = soi.name
    LEFT JOIN kot_stock kot_stock ON kot_stock.item_code = soi.item_code
    LEFT JOIN platting_stock platting_stock ON platting_stock.item_code = soi.item_code


    WHERE
        so.docstatus = 1
        AND cust.custom_locked = 0
        AND so.status NOT IN ('Closed', 'Cancelled', 'Completed')
        AND (so.custom_order_status IS NULL OR so.custom_order_status NOT IN ('NPD', 'Fore Cast'))
        AND so.company = %(company)s
        AND (soi.qty - IFNULL(picked.picked_stock_qty, 0)) > 0.001
	    AND (soi.qty - IFNULL(delivered.delivered_qty, 0)) > 0.001
        AND itm.custom_store_name = 'KAVERI'
        AND soi.delivery_date <= LAST_DAY(CURDATE())
        AND (
            kot.so_qty IS NULL OR
            ABS(kot.so_qty - IFNULL(kot.kot_qty, 0)) > 0.001
        )

        
        AND ((soi.stock_qty - IFNULL(delivered.delivered_stock_qty, 0)) - IFNULL(kot.kot_qty, 0)) > 0.001


    ORDER BY soi.delivery_date ASC;

    """

    raw_data = frappe.db.sql(sql, {"company": company, "warehouse": warehouse}, as_dict=True)

    
        # ✅ Fetch total stock value
    stock_value_sql = """
    SELECT 
        ROUND(
            SUM(
                IFNULL(item_price.price_list_rate, 0) * IFNULL(bin.actual_qty, 0)
            ),
            2
        ) AS total_stock_value
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
        AND item.custom_store_name = "GANGA"
        AND wh.company = %(company)s
        AND bin.actual_qty > 0
    """

    total_stock_value = frappe.db.sql(stock_value_sql, {"company": company}, as_dict=True)[0]["total_stock_value"] or 0


    billed_value_sql = """
    SELECT 
        ROUND(SUM(IFNULL(sii.base_net_amount, 0)), 2) AS total_billed_value
    FROM 
        `tabSales Invoice` si
    JOIN 
        `tabSales Invoice Item` sii ON si.name = sii.parent
    JOIN 
        `tabItem` item ON item.name = sii.item_code
    WHERE
        si.company = %(company)s
        AND si.docstatus = 1
        AND item.custom_store_name = 'Ganga'
    """

    billed_value = frappe.db.sql(billed_value_sql, {"company": company}, as_dict=True)[0].get("total_billed_value") or 0


    stock_tracker = {}
    for row in raw_data:
        item = row["item_code"]
        curr_pending = row["dn_current_pending_qty"]
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
        total_pending_qty = sum(row.get("dn_current_pending_qty", 0) for row in raw_data)

        # Count colors
        green_count = 0
        orange_count = 0
        red_count = 0
        blue_count = 0  # Add this


        for row in raw_data:
            to_pick = row.get("to_pick_qty", 0)
            pending = row.get("dn_current_pending_qty", 0)
            available = row.get("available_stock", 0)
            plating = row.get("platting_stock_qty", 0)

            if plating > 0 and available == 0:
                blue_count += 1
            elif to_pick == 0:
                red_count += 1
            elif to_pick < pending:
                orange_count += 1
            elif to_pick == pending:
                green_count += 1

            message = [f"""
            <!-- First Row: 2 columns -->
            <div style='display: flex; gap: 16px; margin-bottom: 12px;'>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    💰 Total Stock Value<br>
                    <span style='color:#28a745;'>₹{total_stock_value:,.2f}</span>
                </div>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    💵 Total Billed Value<br>
                    <span style='color:#28a745;'>₹{billed_value:,.2f}</span>
                </div>
            </div>

            <!-- Second Row: 4 columns -->
            <div style='display: flex; gap: 16px; margin-bottom: 12px;'>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    ✅ Total Items Pending<br><span style='color:#c82333;'>00{tol_len_items}</span>
                </div>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    📄 Total SOs Pending<br><span style='color:#c82333;'>00{unique_sales_orders}</span>
                </div>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    🧑‍🤝‍🧑 Total Customers<br><span style='color:#c82333;'>00{unique_customers}</span>
                </div>
                <div style='flex:1; font-size:22px; font-weight:bold; color:#383d41; 
                            background-color:#e2e3e5; padding:12px; border-radius:8px; text-align:center;'>
                    📦 Total Pending Qty<br><span style='color:#c82333;'>{total_pending_qty:.2f}</span>
                </div>
            </div>

            <!-- Third Row: Color-coded stats -->
            <div style='display: flex; gap: 16px;'>
                <div style='flex:1; font-size:20px; font-weight:bold; color:#155724; 
                            background-color:#d4edda; padding:10px; border-radius:8px; text-align:center;'>
                    🟩 Available Stock<br><span style='color:#c82333;'>{green_count}</span>
                </div>
                <div style='flex:1; font-size:20px; font-weight:bold; color:#856404; 
                            background-color:#fff3cd; padding:10px; border-radius:8px; text-align:center;'>
                    🟧 Partial Stock<br><span style='color:#c82333;'>{orange_count}</span>
                </div>
                <div style='flex:1; font-size:20px; font-weight:bold; color:#721c24; 
                            background-color:#f8d7da; padding:10px; border-radius:8px; text-align:center;'>
                    🟥 No Stock<br><span style='color:#c82333;'>{red_count}</span>
                </div>
                <div style='flex:1; font-size:20px; font-weight:bold; color:#004085; 
                            background-color:#cce5ff; padding:10px; border-radius:8px; text-align:center;'>
                    🔵 Non Moving Stock<br><span style='color:#c82333;'>{blue_count}</span>
                </div>
            </div>
            """]




    return columns, raw_data, message