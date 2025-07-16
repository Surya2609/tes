frappe.ui.form.on('Purchase Receipt', {
    validate: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            if (!frm.doc.custom_asn) {
                if (frm.doc.supplier_delivery_note) {
                    const pr_list = await frappe.db.get_list('Advance Shipment Notice', {
                        filters: {
                            supplier_invoice_no: frm.doc.supplier_delivery_note
                        },
                        fields: ['name'],
                        limit: 1000
                    });
                    if (pr_list && pr_list.length > 0) {                       
                            frappe.throw(`This Supplier Delivery Note is already linked with an uncompleted ASN: <b>${pr_list[0].name}</b>. Please complete or remove it first.`);
                    }
                }
            }
        }
    }
});