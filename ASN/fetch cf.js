frappe.ui.form.on('Advance Shipment Child', {
    item: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.stock_uom && row.uom) {
            frappe.call({
                method: 'get_item_cf_details',
                args: {
                    item_code: row.item,
                    uom: row.uom
                },
                callback: function (r) {
                    if (r.message && r.message.length > 0) {
                        let cf = r.message[0].conversion_factor;

                        // ✅ Set conversion factor into the 'conversion_factor' field
                        frappe.model.set_value(cdt, cdn, 'convertion_factor', cf);
                    }
                }
            });
        }
    },

    convertion_factor: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.convertion_factor != 0) {
            let stockQty = row.qty * row.convertion_factor;
            console.log("st qty", stockQty);
            frappe.model.set_value(cdt, cdn, 'stock_uom_qty', stockQty);
        }
    },

    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.convertion_factor != 0) {
            let stockQty = row.qty * row.convertion_factor;
            console.log("st qty", stockQty);
            frappe.model.set_value(cdt, cdn, 'stock_uom_qty', stockQty);
        }
    },    

});