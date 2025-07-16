frappe.ui.form.on('Sales Invoice', {
    validate: function (frm) {
        let outstanding = parseFloat(frm.doc.outstanding_amount) || 0;
        let round_total = parseFloat(frm.doc.rounded_total) || 0;

        if (outstanding !== round_total) {
            frappe.throw('Outstanding Amount and Rounded Total Amount are mismatching.');
        }
    }
});
