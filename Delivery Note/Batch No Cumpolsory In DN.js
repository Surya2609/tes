frappe.ui.form.on('Delivery Note', {
    validate: function(frm) {
        let missing_batch_no = [];
        $.each(frm.doc.items || [], function(index, row) {
            if (!row.batch_no) {
                missing_batch_no.push(row.item_code);
            }
        });
        if (missing_batch_no.length > 0) {
            frappe.msgprint(__('The following items are missing batch numbers: ' + missing_batch_no.join(', ')));
            frappe.validated = false;
        }
    }
});
