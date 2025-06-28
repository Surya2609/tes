SELECT
    gl.posting_date,
    gl.voucher_type,
    gl.voucher_no,
    gl.against_voucher_type,
    gl.against_voucher,
    gl.account,
    gl.debit,
    gl.credit,
    gl.remarks
FROM `tabGL Entry` gl
JOIN (
    SELECT voucher_no
    FROM `tabGL Entry`
    WHERE party_type = 'Customer'
      AND party = "CUST536"
      AND docstatus = 1
    GROUP BY voucher_no
    HAVING COUNT(*) > 1
) dup ON gl.voucher_no = dup.voucher_no
WHERE gl.party_type = 'Customer'
  AND gl.party = "CUST536"
  AND gl.docstatus = 1
ORDER BY gl.voucher_no, gl.posting_date DESC;
