SELECT
    pi.supplier AS "Supplier:Link/Supplier:180",
    MAX(s.supplier_name) AS "Supplier Name:Data:180",

    -- Opening Balance from GL Entries (before from_date)
    (
        SELECT SUM(debit - credit)
        FROM `tabGL Entry`
        WHERE
            party_type = 'Supplier'
            AND party = pi.supplier
            AND company = %(company)s
            AND posting_date < %(from_date)s
            AND is_cancelled = 0
    ) AS "Opening Balance:Currency:120",

    -- Invoice Total (non-return)
    SUM(CASE WHEN pi.is_return = 0 THEN pi.grand_total ELSE 0 END) AS "Invoice Amount:Currency:120",

    -- Credit Note (Return)
    SUM(CASE WHEN pi.is_return = 1 THEN pi.grand_total ELSE 0 END) AS "Credit Note:Currency:120",

    -- Paid Amount from Payment Entry Reference
    IFNULL(SUM(paid_summary.paid_amount), 0) AS "Paid Amount:Currency:120",

    -- Outstanding = Invoice - Paid - Credit Note
    (SUM(CASE WHEN pi.is_return = 0 THEN pi.grand_total ELSE 0 END)
     - IFNULL(SUM(paid_summary.paid_amount), 0)
     - SUM(CASE WHEN pi.is_return = 1 THEN pi.grand_total ELSE 0 END)
    ) AS "Invoice Outstanding:Currency:120",

    -- Advance Amount (not linked to invoice)
    IFNULL(adv.advance_amount, 0) AS "Advance Amount:Currency:120",

    -- Final Pending to Pay = Invoice Outstanding - Advance
    (
        (SUM(CASE WHEN pi.is_return = 0 THEN pi.grand_total ELSE 0 END)
         - IFNULL(SUM(paid_summary.paid_amount), 0)
         - SUM(CASE WHEN pi.is_return = 1 THEN pi.grand_total ELSE 0 END)
        )
        - IFNULL(adv.advance_amount, 0)
    ) AS "Final Pending:Currency:120"

FROM
    `tabPurchase Invoice` pi
LEFT JOIN
    `tabSupplier` s ON s.name = pi.supplier

-- Paid amounts from Payment Entry Reference
LEFT JOIN (
    SELECT
        reference_name,
        SUM(allocated_amount) AS paid_amount
    FROM
        `tabPayment Entry Reference`
    WHERE
        docstatus = 1 AND reference_doctype = 'Purchase Invoice'
    GROUP BY
        reference_name
) paid_summary ON paid_summary.reference_name = pi.name

-- Advance Payments (not linked to any invoice)
LEFT JOIN (
    SELECT
        pe.party AS supplier,
        SUM(pe.paid_amount) AS advance_amount
    FROM
        `tabPayment Entry` pe
    LEFT JOIN
        `tabPayment Entry Reference` ref ON pe.name = ref.parent
    WHERE
        pe.docstatus = 1
        AND pe.party_type = 'Supplier'
        AND pe.company = %(company)s
        AND pe.posting_date BETWEEN %(from_date)s AND %(to_date)s
        AND ref.name IS NULL
    GROUP BY
        pe.party
) adv ON adv.supplier = pi.supplier

WHERE
    pi.docstatus = 1
    AND pi.company = %(company)s
    AND pi.posting_date BETWEEN %(from_date)s AND %(to_date)s

GROUP BY
    pi.supplier
ORDER BY
    pi.supplier;
