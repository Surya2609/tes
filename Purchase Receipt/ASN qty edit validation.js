frappe.ui.form.on('Purchase Receipt Item', {
    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item_code && row.asn_qty && row.asn_id) {
            if (row.qty != row.asn_qty) {
                frappe.msgprint("ASN qty is Mismatching for ASN Id is ", row.asn_id);
                frappe.model.set_value(row.doctype, row.name, 'qty', row.asn_qty);
            }
        }
    },
});