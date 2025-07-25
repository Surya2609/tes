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

    before_submit: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS PRIVATE LIMITED" || frm.doc.company == "MVD FASTENERS 1") {
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
});

async function updateKotQty(kot_id) {
    console.log("kot_id", kot_id);
    if (kot_id) {
        await frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'KOT Report',
                name: kot_id,
                fieldname: {
                    kot_qty: 0
                }
            }
        });
    }
}