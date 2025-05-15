frappe.ui.form.on('Delivery Trip', {
    before_save: function (frm) {
        getDnDate(frm);
    },
});

function getDnDate(frm) {
    let pending = 0;

    frm.doc.delivery_stops.forEach(function (row) {
        if (row.delivery_note) {
            pending++;
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Delivery Note",
                    filters: { name: row.delivery_note },
                    fieldname: "posting_date"
                },
                callback: function (r) {
                    if (r.message) {
                        frappe.model.set_value(row.doctype, row.name, 'custom_document_date', r.message.posting_date);
                    }
                    pending--;
                    if (pending === 0) {
                        frm.refresh_field('delivery_stops');
                    }
                }
            });
        }
    });
}
