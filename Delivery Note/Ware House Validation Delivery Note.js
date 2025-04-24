frappe.ui.form.on('Delivery Note Item', {
    warehouse: function (frm, cdt, cdn) {
        console.log("warehse", frm.doc.default_warehouse);
        const invalid_warehouses = ["Work In Progress - MFPLD", "Rejected Item - MFPLD", "Work In Progress - RFPL", "Rejected Item - RFPL"];
        let row = frappe.get_doc(cdt, cdn);

        if (invalid_warehouses.includes(row.warehouse)) {
            frappe.msgprint({
                title: __("Invalid Warehouse"),
                message: __(
                    `You cannot select the warehouse "${row.warehouse}". The warehouse has been reset to the default.`
                ),
                indicator: "orange",
            });
            get_default_warehouse(row.item_code)
                .then(default_warehouse => {
                    frappe.model.set_value(cdt, cdn, 'warehouse', default_warehouse || '');
                })
                .catch(error => {
                    console.log("Error: ", error);
                });
        }
    }
});

frappe.ui.form.on('Delivery Note', {
    set_warehouse: function (frm) {
        const invalid_warehouses = ["Work In Progress - MFPLD", "Rejected Item - MFPLD", "Work In Progress - RFPL", "Rejected Item - RFPL"];

        if (invalid_warehouses.includes(frm.doc.set_warehouse)) {
            frappe.msgprint({
                title: __("Invalid Warehouse"),
                message: __(
                    `You cannot set the warehouse "${frm.doc.set_warehouse}" for all items. Please select a valid warehouse.`
                ),
                indicator: "red",
            });

            frm.set_value('set_warehouse', null);
        }
    }
});

function get_default_warehouse(item_code) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Item",
                name: item_code
            },
            callback: function (response) {
                if (response.message) {
                    let item = response.message;

                    let default_warehouse = null;
                    if (item.item_defaults && item.item_defaults.length > 0) {
                        default_warehouse = item.item_defaults[0].default_warehouse; // Assuming the first entry
                    }

                    if (default_warehouse) {
                        // Resolve the promise with the default warehouse
                        resolve(default_warehouse);
                    } else {
                        // If no default warehouse, reject the promise
                        reject(__('No default warehouse found. Please select a Source Warehouse.'));
                    }
                } else {
                    reject(__('Item not found.'));
                }
            }
        });
    });
}