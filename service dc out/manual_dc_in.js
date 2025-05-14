frappe.ui.form.on('Service DC OUT', {
    refresh: function (frm) {
        frm.add_custom_button("Mannual Insert", function () {
            set_batch_no(frm, "RF-ST-25-26-00630");
        })
    },
});

function set_batch_no(frm, name) {
    frappe.call({
        method: "get_submited_stock_entry",
        args: {
            stock_name: name
        },
        callback: function (get_response) {
            if (get_response.message && Array.isArray(get_response.message)) {
                console.log("Response message:", get_response.message);
                let items_to_insert = [];
                console.log("items chec", frm.doc.items);
                // Iterate through each line item in the form
                frm.doc.items.forEach(function (row) {
                    console.log("Processing line item:", row.item_code, row.qty);

                    // Iterate over the response items to find all matching items
                    get_response.message.forEach(function (item) {
                        if (item.item_code === row.item && item.qty == row.qty) {                        
                            frappe.model.set_value(row.doctype, row.name, "batch_no", item.batch_no);
                            frappe.model.set_value(row.doctype, row.name, "transfer_qty", item.transfer_qty);
                            frappe.model.set_value(row.doctype, row.name, "default_uom", item.stock_uom);
                            frappe.model.set_value(row.doctype, row.name, "conversion_factor", item.conversion_factor);
                            frappe.model.set_value(row.doctype, row.name, "stock_transfer_id", item.stock_entry_name);
                            console.log(`Set batch_no ${item.batch_no} for item ${row.item}`);

                            items_to_insert.push({
                                item: row.item,
                                total_qty: item.transfer_qty,
                                balance_qty: item.transfer_qty,
                                uom: item.uom,
                                received_qty: "0",
                                service_for: row.server_for,
                                source_warehouse: row.target_warehouse
                            });

                        }
                    });
                });

                if (items_to_insert.length > 0) {
                    console.log("lst", items_to_insert);
                    insert_dc_in(frm, items_to_insert);
                }
                frm.refresh_field("items");
            } else {
                frappe.msgprint(__('Failed to fetch Stock Entry details: ' + JSON.stringify(get_response.message)));
            }
        }
    });
}