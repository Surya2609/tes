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
                    console.log("sales_order", row.sales_order_item);

                    frappe.call({
                        method: 'get_current_pl_qty',
                        args: {
                            item_code: row.item_code,
                            so_no: row.sales_order,
                            sales_order_item: row.sales_order_item
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

                                if (so_uom !== base_uom) {
                                    if (base_uom == "Nos") {
                                        kot_qty = so_uom == "Nos" ? kot_qty * c_f : kot_qty / c_f;
                                    } else {
                                        kot_qty = so_uom == "Kg" ? kot_qty * c_f : kot_qty / c_f;
                                    }
                                } else {
                                    kot_qty = kot_qty;
                                }

                                frappe.model.set_value(row.doctype, row.name, 'custom_kot_pick_qty', kot_qty || '');

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
        if (frm.doc.company == "MVD FASTENERS 1") {
            if (frm.doc.customer && frm.doc.company) {
                console.log("Running during Submit");

                let grouped = {};
                let item_code_map = {};

                for (let row of frm.doc.locations || []) {
                    const so_item = row.sales_order_item;
                    const item_code = row.item_code;
                    const qty = parseFloat(row.qty || 0);
                    const kot_qty = parseFloat(row.custom_kot_pick_qty || 0);

                    if (!grouped[so_item]) {
                        grouped[so_item] = { total_qty: 0, kot_qty: kot_qty };
                        item_code_map[so_item] = item_code;
                    }

                    grouped[so_item].total_qty += qty;
                }

                let mismatch_list = [];

                for (let so_item in grouped) {
                    let total_qty = grouped[so_item].total_qty.toFixed(5);
                    let kot_qty = grouped[so_item].kot_qty.toFixed(5);

                    if (Math.abs(total_qty - kot_qty) > 0.001) {
                        mismatch_list.push(`Item: ${item_code_map[so_item]}, SO Item: ${so_item}`);
                    }
                }

                if (mismatch_list.length > 0) {
                    frappe.throw("Qty mismatch found for:\n" + mismatch_list.join("\n"));
                }

                // Update Kot Qty if validation passes
                for (let row of frm.doc.locations || []) {
                    await updateKotQty(row.custom_kot_id, row.qty);
                }

            } else {
                frappe.throw("Please select Customer and Company");
            }
        }
    }
    // before_save: async function (frm) {
    //     if (frm.doc.company == "MVD FASTENERS 1") {
    //         if (frm.doc.customer && frm.doc.company) {
    //             console.log("Running during Submit");

    //             let mis_matching = [];
    //             let matched_items = [];

    //             for (let i = 0; i < (frm.doc.locations || []).length; i++) {
    //                 let row = frm.doc.locations[i];
    //                 let kot_qty = parseFloat((row.custom_kot_pick_qty || 0)).toFixed(5);
    //                 let picked_qty = parseFloat((row.qty || 0)).toFixed(6);

    //                 console.log("kot_qty", kot_qty);
    //                 console.log("picked_qty", picked_qty);


    //                 if (Math.abs(kot_qty - picked_qty) > 0.001) {
    //                     mis_matching.push(`Row ${i + 1} - ${row.item_code}`);
    //                 } else {
    //                     matched_items.push(row);
    //                 }
    //             }

    //             if (mis_matching.length > 0) {
    //                 frappe.throw("Mismatch found in:\n" + mis_matching.join("\n"));
    //             }

    //             for (let item of matched_items) {
    //                 await updateKotQty(item.custom_kot_id, item.qty);
    //             }

    //         } else {
    //             frappe.throw("Please select Customer and Company");
    //         }
    //     }

    // }

    //     before_submit: async function (frm) {
    //         if (frm.doc.customer && frm.doc.company) {
    //             console.log("Running during Submit");

    //             let mis_matching = [];
    //             let matched_items = [];

    //             for (let i = 0; i < (frm.doc.custom_unique_items || []).length; i++) {
    //                 let row = frm.doc.custom_unique_items[i];
    //                 let kot_qty = parseFloat((row.kot_pick_qty || 0)).toFixed(5);
    //                 let picked_qty = parseFloat((row.picked_qty || 0)).toFixed(6);

    //                 console.log("kot_qty", kot_qty);
    //                 console.log("picked_qty", picked_qty);


    //                 if (Math.abs(kot_qty - picked_qty) > 0.001) {
    //     mis_matching.push(`Row ${i + 1} - ${row.item_code}`);
    // } else {
    //     matched_items.push(row);
    // }
    //             }

    //             if (mis_matching.length > 0) {
    //                 frappe.throw("Mismatch found in:\n" + mis_matching.join("\n"));
    //             }

    //             for (let item of matched_items) {
    //                 await updateKotQty(item.kot_id, item.picked_qty);
    //             }

    //         } else {
    //             frappe.throw("Please select Customer and Company");
    //         }
    //     }


});

async function updateKotQty(kot_id, qty) {
    console.log("kot_id", kot_id);

    if (kot_id) {
        const current = await frappe.db.get_value('KOT Report', kot_id, ['total_picked_qty', 'convertion_factor', 'base_uom', 'so_uom']);

        let total_pk_qty = parseFloat(current.message.total_picked_qty || 0); // Keep as number
        let c_f = parseFloat(current.message.convertion_factor || 0);
        let base_uom = current.message.base_uom;
        let so_uom = current.message.so_uom;
        let current_pick_qty = parseFloat(qty || 0); // Also number

        console.log("current_pick_qty", current_pick_qty);
        console.log("c_f", c_f);
        console.log("base_uom", base_uom);
        console.log("so_uom", so_uom);
        console.log("total_pk_qty", total_pk_qty);

        // UOM Conversion
        if (so_uom !== base_uom) {
            if (base_uom === "Nos") {
                current_pick_qty = so_uom === "Kg" ? current_pick_qty * c_f : current_pick_qty / c_f;
            } else {
                current_pick_qty = so_uom === "Nos" ? current_pick_qty * c_f : current_pick_qty / c_f;
            }
        }

        let updated_qty = total_pk_qty + current_pick_qty;

        console.log("Current:", total_pk_qty.toFixed(8), "New:", current_pick_qty.toFixed(8), "Updated:", updated_qty.toFixed(8));

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