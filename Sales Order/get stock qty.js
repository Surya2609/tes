frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        if (frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            let row = locals[cdt][cdn];
            if (row.item_code) {
                frappe.call({
                    method: 'get_allwarehosue_stk_qty',
                    args: {
                        item_code: row.item_code
                    },
                    callback: function (r) {
                        if (r.message && r.message.length > 0) {
                            console.log("message", r.message);
                            let stock_qty = parseFloat(r.message[0].total_qty);
                            frappe.model.set_value(cdt, cdn, 'custom_stk_qty', stock_qty);
                        }
                    }
                });
            }
        }
    },
});