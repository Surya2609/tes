frappe.ui.form.on('Service DC IN Items', {

    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        let g_qty = parseFloat(row.qty);
        console.log(g_qty);
        if (!row.source_warehouse) {
            frappe.msgprint(__('Select Source Warehouse First'));
            frappe.model.set_value(cdt, cdn, 'qty', 0);
            return;
        }

        if (row.source_warehouse && row.item && g_qty > 0) {
            get_validation_stock(row.source_warehouse, row.item, g_qty, cdt, cdn);
        }
    }
});

function get_validation_stock(warehouse, item, g_qty, cdt, cdn) {
    frappe.call({
        method: "get_warehouse_details_for_item",
        args: {
            warehouse: warehouse,
            item: item
        },
        callback: function (get_response) {
            console.log(get_response.message);
            if (get_response.message) {
                let store_qty = parseFloat(get_response.message[0].actual_qty);
                if (store_qty < g_qty) {
                frappe.msgprint(__('The entered quantity exceeds the available quantity in the selected source warehouse. Available quantity: ' + store_qty));
                    frappe.model.set_value(cdt, cdn, 'qty', 0);
                    return;
                }
            }
        }
    });
}
