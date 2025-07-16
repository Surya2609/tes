company = frappe.form_dict.get('company')
supplier = frappe.form_dict.get('supplier')

value = frappe.db.sql("""
SELECT 
    asn_item.name AS id,
    asn.name,
    asn.total_qty,
    asn.total_amount,
    asn.supplier,
    asn.supplier_invoice_no,
    asn.supplier_invoice_date,
    asn.estimated_arrival_date,
    asn.llr,
    asn.transporter,
    asn.tax_category,
    asn.purchase_taxes_and_charges_template,
    asn.apply_additional_discount_on,
    asn.additional_discount_percentage,
    asn.additional_discount_amount,
    asn.disable_rounded_total,
    asn_item.item,
    asn_item.item_name,
    asn_item.qty,
    asn_item.uom,
    asn_item.rate,
    asn_item.unit_rate,
    asn_item.discount_percent,
    asn_item.poi_name,
    asn_item.amount,
    asn_item.po_no,
    asn_item.currency,
    asn_item.buying_price_list
FROM 
    `tabAdvance Shipment Notice` as asn
JOIN 
    `tabAdvance Shipment Child` as asn_item ON asn_item.parent = asn.name
WHERE 
    asn.completed != 1 AND
    asn.company = %s AND
    asn.supplier = %s
""", (company, supplier), as_dict=1)

frappe.response['message'] = value

