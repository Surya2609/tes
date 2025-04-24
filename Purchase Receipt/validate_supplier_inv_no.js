frappe.ui.form.on('Purchase Receipt', {
    validate: function (frm) {
        console.log("doc", frm.doc);
        let supplier_inv_no = frm.doc.supplier_delivery_note;
        console.log("sin", supplier_inv_no);
        console.log("is retuern", frm.doc.is_return);
        if (supplier_inv_no && !frm.doc.is_return) {
            return frappe.call({
                method: "get_supplier_inv_no",
                args: {
                    supplier_invoice_no: supplier_inv_no
                },
                callback: function (response) {
                    console.log("r.message", response.message);
                    // co
                    if (response.message && response.message.length > 0 && response.message[0].name !== frm.doc.name) {
                        frappe.msgprint(__("This Supplier Invoice Number ({0}) already exists in ({1}).", [supplier_inv_no, response.message[0].name]));
                        frappe.validated = false;
                    }
                }
            });
        }
    }
});
