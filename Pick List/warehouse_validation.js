frappe.ui.form.on('Pick List', {
    validate: function (frm) {
        const restricted_warehouses = ["Work In Progress - MFPLD", "Rejected Item - MFPLD", "Work In Progress - RFPL", "Rejected Item - RFPL"];        
            let restricted_items = [];
            $.each(frm.doc.locations || [], function (index, row) {
                console.log("rw",row);
                if (restricted_warehouses.includes(row.warehouse)) {
                    restricted_items.push(row.item_code);
                    frm.doc.locations.splice(index, 1);
                }
            });
            if (restricted_items.length > 0) {
                frappe.msgprint(__('The following items have been removed due to restricted warehouses: ' + restricted_items.join(', ')));
                frm.refresh_field('locations');
                frappe.validated = false;
            }
    }
});



frappe.ui.form.on("Pick List", {
    refresh: function (frm) {
        const allowed_keywords = ["Store", "Finished Goods"]; // Allowed warehouse names
        let valid_locations = [];
        let removed_items = [];
        let stock_shortage = [];
        let promises = [];

        (frm.doc.locations || []).forEach(row => {
            let warehouse_name = row.warehouse.split(" - ")[0].trim(); // Extract prefix (e.g., "Store" from "Store - MFPLD")

            // ✅ Check if warehouse starts with "Store" or "Finished Goods"
            if (allowed_keywords.some(keyword => warehouse_name.startsWith(keyword))) {
                // Check stock availability
                let promise = frappe.db.get_value("Bin", {
                    warehouse: row.warehouse,
                    item_code: row.item_code
                }, "actual_qty").then(r => {
                    let stock_qty = r.message.actual_qty || 0;
                    if (stock_qty < row.qty) {
                        stock_shortage.push(`${row.item_code} (Needed: ${row.qty}, Available: ${stock_qty})`);
                    }
                });

                promises.push(promise);
                valid_locations.push(row); // ✅ Keep allowed warehouses
            } else {
                removed_items.push(`${row.item_code} (Warehouse: ${row.warehouse})`);
            }
        });

        // ✅ Replace with only valid warehouses
        frm.doc.locations = valid_locations;
        frm.refresh_field('locations');

        return Promise.all(promises).then(() => {
            if (removed_items.length > 0) {
                frappe.msgprint({
                    title: __("Invalid Warehouses Removed"),
                    message: __("These items were removed because they were in restricted warehouses:<br><b>{0}</b>", 
                        [removed_items.join("<br>")]),
                    indicator: "red"
                });

                frappe.validated = false; // ❌ Prevent saving if restricted warehouses were used
            }

            if (stock_shortage.length > 0) {
                frappe.throw(__("Stock not available in 'Store' or 'Finished Goods':<br><b>{0}</b>", 
                    [stock_shortage.join("<br>")]));
            }
        });
    }
});
