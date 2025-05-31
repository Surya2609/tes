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
                method: "get_dn_date_ph_no",
                args: {
                    delivery_note: row.delivery_note
                },
                callback: function (r) {
                    console.log("r mesg", r.message);
                    if (r.message) {
                        let contact_no = "";
                        frappe.model.set_value(row.doctype, row.name, 'custom_document_date', r.message[0].posting_date);

                        if (r.message[0].contact_no_1) {
                            contact_no = r.message[0].contact_no_1;
                        } else if (r.message[0].contact_no_2) {
                            contact_no = r.message[0].contact_no_2;
                        } else {
                            contact_no = r.message[0].contact_no_3;
                        }
                        frappe.model.set_value(row.doctype, row.name, 'custom_sales_person_id', r.message[0].salesPersonId);
                        frappe.model.set_value(row.doctype, row.name, 'custom_sales_contact_no', contact_no);
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
