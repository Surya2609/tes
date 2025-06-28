frappe.ui.form.on('Pick List', {
    refresh: function (frm) {
        frm.add_custom_button('Get qty', () => {
            console.log("invoking");
            if (frm.doc.customer && frm.doc.company) {
                console.log("invoking2");
                for (let row of frm.doc.locations || []) {
                    console.log("row", row);
                    console.log("item_code", row.item_code);
                    console.log("sales_order", row.sales_order);
                    frappe.call({
                        method: 'get_current_pl_qty',
                        args: {
                            item_code: row.item_code,
                            so_no: row.sales_order
                        },
                        callback: function (r) {
                            console.log("working r message", r.message);
                            if (r.message && r.message.length > 0) {
                                let result = r.message[0];
                                let c_f = parseFloat(result.convertion_factor || 0);
                                let so_uom = result.so_uom;
                                let base_uom = result.base_uom;
                                let kot_qty = result.kot_qty;

                                console.log("working", result);

                                if (so_uom && base_uom && so_uom == base_uom) {
                                    frappe.model.set_value(row.doctype, row.name, 'custom_kot_pick_qty', kot_qty || '');
                                } else if (so_uom && base_uom && so_uom !== base_uom) {
                                    if (so_uom == "Nos" && base_uom == "Kg") {
                                        kot_qty = kot_qty / c_f;
                                    } else if (so_uom == "Kg" && base_uom == "Nos") {
                                        kot_qty = c_f * kot_qty;
                                    }
                                    frappe.model.set_value(row.doctype, row.name, 'custom_kot_pick_qty', kot_qty || '');
                                }

                                frappe.model.set_value(row.doctype, row.name, 'custom_kot_id', result.name || '');
                            }
                        }
                    });
                }
            } else {
                frappe.msgprint("Please select Customer and Company");
            }
        });
    },

    before_save: async function (frm) {
        if (frm.doc.customer && frm.doc.company) {
            console.log("Running during Submit");

            let mis_matching = [];
            let matched_items = [];

            for (let i = 0; i < (frm.doc.custom_unique_items || []).length; i++) {
                let row = frm.doc.custom_unique_items[i];
                let kot_qty = parseFloat(row.kot_pick_qty || 0);
                let picked_qty = parseFloat(row.picked_qty || 0);

                if (kot_qty !== picked_qty) {
                    mis_matching.push(`Row ${i + 1} - ${row.item_code}`);
                } else {
                    matched_items.push(row);
                }
            }

            if (mis_matching.length > 0) {
                frappe.throw("Mismatch found in:\n" + mis_matching.join("\n"));
            }

            for (let item of matched_items) {
                await updateKotQty(item.kot_id, item.picked_qty);
            }

        } else {
            frappe.throw("Please select Customer and Company");
        }
    }
});

async function updateKotQty(kot_id, qty) {
    console.log("kot_id", kot_id);

    if (kot_id) {
        const current = await frappe.db.get_value('KOT Report', kot_id, ['total_picked_qty', 'convertion_factor', 'base_uom', 'so_uom']);

        let total_pk_qty = parseFloat(current.message.total_picked_qty || 0);
        let c_f = parseFloat(current.message.convertion_factor || 0);
        let base_uom = current.message.base_uom;
        let so_uom = current.message.so_uom;
        let current_pick_qty = qty;

        console.log("current_pick_qty", current_pick_qty);
        console.log("c_f", c_f);
        console.log("base_uom", base_uom);
        console.log("so_uom", so_uom);
        console.log("total_pk_qty", total_pk_qty);


        if (so_uom && base_uom && so_uom == base_uom) {
            current_pick_qty = qty;
        } else if (so_uom && base_uom && so_uom !== base_uom) {

            if (so_uom == "Nos" && base_uom == "Kg") {
                current_pick_qty = c_f * current_pick_qty;
            } else if (so_uom == "Kg" && base_uom == "Nos") {
                current_pick_qty = current_pick_qty / c_f;
            }

        }


        let updated_qty = total_pk_qty + parseFloat(current_pick_qty || 0);

        console.log("Current:", total_pk_qty, "New:", current_pick_qty, "Updated:", updated_qty);

        await frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'KOT Report',
                name: kot_id,
                fieldname: {
                    total_picked_qty: updated_qty,
                    kot_qty: 0
                }
            }
        });
    }
}