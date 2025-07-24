frappe.ui.form.on('Advance Shipment Child', {
    // item: function (frm, cdt, cdn) {
    //     setTimeout(() => {
    //         let row = locals[cdt][cdn];
    //         console.log("inv", row);
    //         console.log("itm", row.item);
    //         console.log("uom", row.uom);

    //         if (row.item && row.uom) {
    //             frappe.call({
    //                 method: 'get_item_cf_details',
    //                 args: {
    //                     item_code: row.item,
    //                     uom: row.uom
    //                 },
    //                 callback: function (r) {
    //                     if (r.message && r.message.length > 0) {
    //                         let cf = r.message[0].conversion_factor;
    //                         frappe.model.set_value(cdt, cdn, 'convertion_factor', cf);
    //                     }
    //                 }
    //             });
    //         }
    //     }, 200); // 200ms delay
    // },

    // convertion_factor: function (frm, cdt, cdn) {
    //     let row = locals[cdt][cdn];
    //     console.log("r", row);
    //     if (row.convertion_factor != 0) {
    //         let stockQty = row.qty * row.convertion_factor;
    //         console.log("st qty", stockQty);
    //         frappe.model.set_value(cdt, cdn, 'stock_uom_qty', stockQty);
    //     }
    // },

    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        let po_pending_qty = parseFloat(row.po_pending_qty) || 0;
        let given_qty = parseFloat(row.qty) || 0;

        if (po_pending_qty !== 0) {
            console.log("po_pending_qty", po_pending_qty);
            console.log("given_qty", given_qty);

            if (po_pending_qty < given_qty) {
                frappe.msgprint("Qty is Exceed Po Qty");
                frappe.model.set_value(cdt, cdn, 'qty', po_pending_qty);
            } else {
                if (row.convertion_factor != 0) {
                    let stockQty = row.qty * row.convertion_factor;
                    console.log("st qty", stockQty);
                    frappe.model.set_value(cdt, cdn, 'stock_uom_qty', stockQty);
                }
            }
        }
    },
});