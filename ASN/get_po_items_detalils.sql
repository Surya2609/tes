company = frappe.form_dict.get('company')
supplier = frappe.form_dict.get('supplier')

value = frappe.db.sql("""
SELECT 
    po.name,
    po.buying_price_list,
    po.currency,
    po.taxes_and_charges,
    po.tax_category,
    po.apply_discount_on,
    po.additional_discount_percentage,
    po.discount_amount,
    po.disable_rounded_total,
    poi.name AS poi_name,
    poi.item_code,
    poi.item_name,
    poi.gst_hsn_code,
    poi.qty AS po_qty,
    poi.received_qty AS grn_qty,
    (poi.qty - poi.received_qty) AS po_pending_qty,
    IFNULL(SUM(ascd.qty), 0) AS transit_qty,

    (poi.qty - poi.received_qty - IFNULL(SUM(ascd.qty), 0)) AS pending_qty,
    
    poi.uom,
    poi.rate,
    poi.custom_unit_rate,
    poi.custom_discount_percent,
    poi.warehouse,
    poi.schedule_date,
    poi.gst_treatment,
    poi.item_tax_template
FROM 
    `tabPurchase Order` po
JOIN 
    `tabPurchase Order Item` poi ON poi.parent = po.name    
LEFT JOIN 
    `tabAdvance Shipment Child` ascd 
    ON ascd.po_no = po.name 
    AND ascd.item = poi.item_code 
    AND ascd.poi_name = poi.name
WHERE
    po.company = %s
    AND po.supplier = %s
    AND po.docstatus = 1
GROUP BY 
    poi.name
HAVING 
    pending_qty > 0
""", (company, supplier), as_dict=1)

frappe.response['message'] = value