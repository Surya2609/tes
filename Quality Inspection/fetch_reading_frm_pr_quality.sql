batch_no = frappe. form_dict.get('batch_no')

valuess = frappe.db.sql("""

SELECT 
    sb_bundle_item.batch_no,
    pri_item.parent AS purchase_receipt_id,
    pri_item.item_code,
    qi.name AS quality_inspection_id,
    qi_reading.*
    # qi_reading.value,
    # qi_reading.min_value,
    # qi_reading.max_value,
    # qi_reading.status
FROM 
    `tabSerial and Batch Bundle` AS sb_bundle
JOIN 
    `tabSerial and Batch Entry` AS sb_bundle_item
ON 
    sb_bundle.name = sb_bundle_item.parent

JOIN 
    `tabPurchase Receipt Item` AS pri_item
ON 
    sb_bundle.name = pri_item.serial_and_batch_bundle
JOIN 
    `tabQuality Inspection` AS qi
ON 
    pri_item.quality_inspection = qi.name
JOIN 
    `tabQuality Inspection Reading` AS qi_reading
ON 
    qi.name = qi_reading.parent
WHERE 
    sb_bundle_item.batch_no = %s;

""", (batch_no), as_dict=1)

frappe.response['message'] = valuess