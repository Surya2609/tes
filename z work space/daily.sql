import frappe
from collections import defaultdict

def execute(filters=None):
    company = filters.get("company") if filters else None

    columns = [
        {"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Data", "width": 150},
        {"label": "Sales Order", "fieldname": "sales_order", "fieldtype": "Link", "options": "Sales Order", "width": 120},
	    {"label": "Locked", "fieldname": "custom_loacked", "fieldtype": "Data", "width": 60},
        {"label": "SO Date", "fieldname": "so_date", "fieldtype": "Date", "width": 100},
        {"label": "Delivery Date", "fieldname": "delivery_date", "fieldtype": "Date", "width": 100},
        {"label": "Convertion Factor", "fieldname": "convertion_factor", "fieldtype": "Float", "width": 100},
        {"label": "Item Code", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 120},
        {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 150},
        {"label": "SO UOM", "fieldname": "so_uom", "fieldtype": "Link", "options": "UOM", "width": 100},
        {"label": "Pending Qty", "fieldname": "so_uom_pending_qty", "fieldtype": "Float", "width": 120},
        {"label": "UOM", "fieldname": "uom", "fieldtype": "Data", "width": 120},
        {"label": "Available Stock", "fieldname": "available_stock", "fieldtype": "Float", "width": 120},
        {"label": "Base Pending Qty", "fieldname": "pending_qty", "fieldtype": "Float", "width": 120},
        {"label": "Remaining Stock", "fieldname": "remaining_stock", "fieldtype": "Float", "width": 120},
        {"label": "Required Qty", "fieldname": "required_qty", "fieldtype": "Float", "width": 120},
        {"label": "ETA", "fieldname": "eta_date", "fieldtype": "Data", "width": 100},
        {"label": "ETA Qty", "fieldname": "eta_qty", "fieldtype": "Float", "width": 100},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Float", "width": 100},
        {"label": "Amount", "fieldname": "amount", "fieldtype": "Float", "width": 100},
    ]

    data = frappe.db.sql("""
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
            (soi.stock_qty - IFNULL(delivered_data.delivered_stock_qty, 0)) AS pending_qty,
            cust.custom_locked AS custom_loacked
        FROM tabSales Order so
        JOIN tabSales Order Item soi ON soi.parent = so.name
            AND soi.item_code NOT IN ("SERVICE CHARGES", "Shipping charges")

        LEFT JOIN (
            SELECT 
                dni.so_detail,
                SUM(dni.qty) AS delivered_qty,
                SUM(dni.stock_qty) AS delivered_stock_qty
            FROM tabDelivery Note Item dni
            JOIN tabDelivery Note dn ON dn.name = dni.parent
            WHERE dn.docstatus = 1 AND dn.is_return != 1
            GROUP BY dni.so_detail
        ) AS delivered_data ON delivered_data.so_detail = soi.name

        LEFT JOIN tabItem itm ON itm.name = soi.item_code
        LEFT JOIN tabCustomer cust ON cust.name = so.customer
        LEFT JOIN (
            SELECT b.item_code, SUM(b.actual_qty) AS actual_qty
            FROM tabBin b
            JOIN tabWarehouse w ON b.warehouse = w.name
            WHERE w.company = %(company)s
            GROUP BY b.item_code
        ) AS bin_sum ON bin_sum.item_code = soi.item_code
        WHERE
            so.docstatus = 1
            AND so.status != 'Closed'
            AND (so.custom_order_status IS NULL OR so.custom_order_status NOT IN ('NPD', 'Fore Cast'))
            AND so.company = %(company)s
            AND (soi.qty - IFNULL(delivered_data.delivered_qty, 0)) > 0
        ORDER BY soi.delivery_date ASC
    """, {"company": company}, as_dict=True)

    running_stock = defaultdict(float)
    results = []

    for row in data:
        item_code = row.item_code
        if item_code not in running_stock:
            running_stock[item_code] = max(row.available_stock, 0)

        stock_before = max(running_stock[item_code], 0)
        remaining = max(stock_before - row.pending_qty, 0)
        running_stock[item_code] = remaining
        req_qty = max(row.pending_qty - stock_before, 0)

        results.append({
            "customer_name": row.customer_name,
            "sales_order": row.sales_order,
            "so_date": row.so_date,
            "delivery_date": row.delivery_date,
            "so_uom": row.so_uom,
            "convertion_factor": row.conversion_factor,
            "item_code": item_code,
            "item_name": row.item_name,
            "available_stock": stock_before,
            "uom": row.uom,
            "pending_qty": row.pending_qty,
            "remaining_stock": remaining,
            "required_qty": req_qty,
            "so_uom_pending_qty": row.so_uom_pending_qty,
            "rate": row.rate,
            "amount": row.amount,
            "custom_loacked": row.custom_loacked,
        })

    # Fetch ETA data
    eta_data = frappe.db.sql("""
        SELECT
            asn_child.item,
            asn.estimated_arrival_date,
            asn_child.stock_uom_qty AS qty
        FROM tabAdvance Shipment Child asn_child
        JOIN tabAdvance Shipment Notice asn ON asn_child.parent = asn.name
        WHERE asn.company = %(company)s AND asn_child.done = 0
        ORDER BY asn.estimated_arrival_date ASC
    """, {"company": company}, as_dict=True)

    eta_lookup = defaultdict(list)
    for row in eta_data:
        eta_lookup[row.item].append({
            "eta_date": row.estimated_arrival_date,
            "eta_qty": row.qty
        })

    eta_usage_tracker = defaultdict(list)

    for row in results:
        item_code = row["item_code"]
        row_eta_details = []
        total_eta_qty = 0

        if row["required_qty"] > 0:
            remaining_req = row["required_qty"]
            eta_list = eta_lookup.get(item_code, [])

            for eta in eta_list:
                eta_date = eta["eta_date"]
                already_used = sum(
                    e["used_qty"] for e in eta_usage_tracker[item_code] if e["eta_date"] == eta_date
                )
                available_eta = eta["eta_qty"] - already_used

                if available_eta <= 0:
                    continue

                used_qty = min(remaining_req, available_eta)

                eta_usage_tracker[item_code].append({
                    "eta_date": eta_date,
                    "used_qty": used_qty
                })

                row_eta_details.append(f"{used_qty:.3f} on {eta_date.strftime('%d-%m-%Y')}")
                total_eta_qty += used_qty
                remaining_req -= used_qty

                if remaining_req <= 0:
                    break

            row["eta_date"] = ", ".join(row_eta_details) if row_eta_details else None
            row["eta_qty"] = round(total_eta_qty, 3)
        else:
            row["eta_date"] = None
            row["eta_qty"] = None

    return columns, results