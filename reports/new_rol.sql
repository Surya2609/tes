SELECT
    FROM `tabItem` itm

    LEFT JOIN (
        SELECT
            poi.item_code
        FROM
            `tabPurchase Order Item` poi
            JOIN `tabPurchase Order` po ON poi.parent = po.name
        WHERE
            po.status NOT IN ('Cancelled')
            AND
        GROUP BY
            poi.item_code
    ) AS po_summery ON bin_sum.item_code = itm.item_code

WHERE
        po.docstatus = 1
        AND po.status != 'Closed'
        AND po.status NOT IN ('Cancelled')
        AND so.company = "MVD FASTENERS PRIVATE LIMITED"
        AND (soi.qty - IFNULL(billed_data.billed_qty, 0)) > 0
ORDER BY
        `so delivery date` ASC