{
    "AckDt": "2025-05-28 10:42:00",
    "AckNo": 112525142066405,
    "BuyerDtls": {
        "Addr1": "PLOT 5C/1, KIADB INDUSTRIAL AREA,,",
        "Addr2": "ATTIBELE",
        "Gstin": "29AADCA1163G1ZX",
        "LglNm": "SCHNEIDER ELECTRIC PRESIDENT SYSTEMS LTD",
        "Loc": "Bengaluru",
        "Pin": 562107,
        "Pos": "29",
        "Stcd": "29",
        "TrdNm": "SCHNEIDER ELECTRIC PRESIDENT SYSTEMS LTD"
    },
    "DocDtls": {
        "Dt": "28/05/2025",
        "No": "MVDF/25-26/5049",
        "Typ": "INV"
    },
    "Irn": "516b9e182df96548433184b7c055bd03d13d21b3130f9a10e9e8a1bc4e74acc7",
    "ItemList": [
        {
            "AssAmt": 4600.0,
            "BchDtls": {
                "Nm": "MV2025050202591"
            },
            "CesAmt": 0,
            "CesNonAdvlAmt": 0,
            "CesRt": 0,
            "CgstAmt": 414.0,
            "Discount": 0,
            "GstRt": 18.0,
            "HsnCd": "73181110",
            "IgstAmt": 0,
            "IsServc": "N",
            "ItemNo": 0,
            "PrdDesc": "CUP WASHER BLACK M6 SMALL",
            "Qty": 10000.0,
            "SgstAmt": 414.0,
            "SlNo": "1",
            "TotAmt": 4600.0,
            "TotItemVal": 5428.0,
            "Unit": "NOS",
            "UnitPrice": 0.46
        },
        {
            "AssAmt": 822.0,
            "BchDtls": {
                "Nm": "MV2025050200059"
            },
            "CesAmt": 0,
            "CesNonAdvlAmt": 0,
            "CesRt": 0,
            "CgstAmt": 73.98,
            "Discount": 0,
            "GstRt": 18.0,
            "HsnCd": "73181500",
            "IgstAmt": 0,
            "IsServc": "N",
            "ItemNo": 0,
            "PrdDesc": "NS WX ASSY AND INST MNL",
            "Qty": 100.0,
            "SgstAmt": 73.98,
            "SlNo": "2",
            "TotAmt": 822.0,
            "TotItemVal": 969.96,
            "Unit": "NOS",
            "UnitPrice": 8.22
        }
    ],
    "PayDtls": {
        "CrDay": 0,
        "PaidAmt": 0,
        "PaymtDue": 6398.0
    },
    "SellerDtls": {
        "Addr1": "Plot No. 308",
        "Addr2": "Jigani Link Road, Jigani Hobli, Bengaluru",
        "Gstin": "29AANCM4557G1ZZ",
        "LglNm": "MVD FASTENERS PRIVATE LIMITED",
        "Loc": "Bengaluru Urban",
        "Pin": 560105,
        "Stcd": "29",
        "TrdNm": "MVD FASTENERS PRIVATE LIMITED"
    },
    "TranDtls": {
        "RegRev": "N",
        "SupTyp": "B2B",
        "TaxSch": "GST"
    },
    "ValDtls": {
        "AssVal": 5422.0,
        "CesVal": 0,
        "CgstVal": 487.98,
        "Discount": 0.0,
        "IgstVal": 0,
        "OthChrg": 0.0,
        "RndOffAmt": 0.04,
        "SgstVal": 487.98,
        "TotInvVal": 6398.0
    },
    "Version": "1.1"
}




SELECT
    si.posting_date AS `Posting Date`,
    si.name AS `Sales Invoice`,
    si.customer AS `Customer`,
    si.customer_name AS `Customer Name`,
    si.base_net_total AS `Total Amount`,
    si.company AS `Company`
FROM
    `tabSales Invoice` si
WHERE
    si.docstatus = 1
    AND si.name NOT IN (
        SELECT DISTINCT ds.custom_sales_invoice
        FROM `tabDelivery Stop` ds
        WHERE ds.custom_sales_invoice IS NOT NULL
    )
    AND si.company = %(company)s
    AND si.is_return = 0
ORDER BY
    si.posting_date DESC;



SELECT
    dt.name AS `delivery_trip`,
    ds.custom_sales_invoice AS `sales_invoice`,
    ds.delivery_note AS `delivery_note`,
    ds.visited AS `visited`,
    dt.departure_time,
    dt.company,
    ds.custom_llr,
    dt.vehicle,
    dt.custom_transporter,
    dt.driver_name,
    dt.custom_phone_no AS `driver_phone`,
    dt.custom_total_boxes,
    dt.driver,
    dt.custom_transport_gst,
    dt.status,
    ds.customer,
    ds.custom_total_qty,
    ds.custom_box,
    ds.contact,
    ds.custom_sales_contact_no,
    ds.custom_sales_person_id,
    dn.posting_date AS `dn_date`,
    dn.total AS `dn_total`

FROM
    `tabDelivery Trip` dt
LEFT JOIN
    `tabDelivery Stop` ds ON ds.parent = dt.name
LEFT JOIN
    `tabSales Invoice` si ON si.name = ds.custom_sales_invoice
LEFT JOIN
    `tabDelivery Note` dn ON dn.name = ds.delivery_note

WHERE
    dt.company = %(company)s
    AND (ds.custom_sales_invoice IS NOT NULL OR ds.delivery_note IS NOT NULL)

ORDER BY
    dt.departure_time DESC, dt.name;