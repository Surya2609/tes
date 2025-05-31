frappe.ui.form.on('Purchase Order', {
    before_cancel: function (frm) {
        if (frm.doc.name) {
            frappe.call({
                method: 'get_po_to_pr_done',
                args: {
                    purchase_order: frm.doc.name
                },
                callback: function (r) {
                    console.log("r me", r.message);
                    if (r.message) {
                        let pur = r.message[0].name;
                        console.log("pur", pur);
                        if (r.message.length > 0) {
                            frappe.msgprint("GRN IN Draft State Contact Grn Person");
                        } else {
                            frappe.msgprint("GRN IN Draft State Contact Grn Person");
                        }
                    }
                }
            });
        }
    }
});