frappe.ui.form.on('Service DC OUT Items', {
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
    },

    view: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if(row.item) {
            console.log(row.item);
            show_stock_details(row.item, row, frm);
        }else {
            frappe.msgprint(__('Select Item Code'));
        }
      
    }
});


function show_stock_details(item, row, frm) {
    frappe.call({
        method: 'get_product_details', // Replace with your server-side method for fetching PR history data
        args: {
            item_code: item // Pass necessary arguments
        },
        callback: function (r) {
            if (r.message && r.message.length > 0) {
                let pro_data = r.message; // Fetch the data for the new dialog
                console.log("New Data:", pro_data);

                let product_details = {
                    item_name: pro_data[0].item_name,
                    item_code: pro_data[0].item_code,
                    unit: pro_data[0].stock_uom,
                    total_stock: pro_data[0].total_stock,
                    is_asset: pro_data[0].is_asset // Check if the item is an asset
                };

                let dialog_fields = [
                    {
                        fieldname: 'product_details',
                        fieldtype: 'HTML',
                        options: `
                        <div style="margin-bottom: 10px; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <div style="font-weight: bold; width: 50%;">Product Name:</div>
          <div style="text-align: left; width: 50%;">${product_details.item_name}</div>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <div style="font-weight: bold; width: 50%;">Product ID:</div>
          <div style="text-align: left; width: 50%;">${product_details.item_code}</div>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <div style="font-weight: bold; width: 50%;">Unit:</div>
          <div style="text-align: left; width: 50%;">${product_details.unit}</div>
      </div>
      ${product_details.is_asset ? '' : `
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <div style="font-weight: bold; width: 50%;">Total Stocks:</div>
          <div style="text-align: left; width: 50%;">${product_details.total_stock}</div>
      </div>`}
  </div>
                      `
                    }
                ];

                // Remove duplicates in pro_data by converting to a Set and back to array for asset or warehouse details
                let unique_assets = [];
                let unique_warehouses = [];

                if (product_details.is_asset) {
                    // Collect unique asset details based on asset_name
                    unique_assets = pro_data.filter((value, index, self) =>
                        index === self.findIndex((t) => (
                            t.asset_name === value.asset_name && t.asset_location === value.asset_location
                        ))
                    );

                    dialog_fields.push({
                        fieldname: 'asset_details',
                        fieldtype: 'Table',
                        cannot_add_rows: true,
                        cannot_delete_rows: true,
                        fields: [
                            {
                                label: 'Asset Name',
                                fieldname: 'asset_name',
                                fieldtype: 'Data',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 3
                            },
                            {
                                label: 'Asset Location',
                                fieldname: 'asset_location',
                                fieldtype: 'Data',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 3
                            },
                            {
                                label: 'Asset Value',
                                fieldname: 'asset_value',
                                fieldtype: 'Currency',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 2
                            }
                        ],
                        data: unique_assets.map(row => ({
                            asset_name: row.asset_name,
                            asset_location: row.asset_location,
                            asset_value: row.asset_value
                        }))
                    });
                } else {
                    unique_warehouses = pro_data.filter((value, index, self) =>
                        index === self.findIndex((t) => (
                            t.warehouse === value.warehouse && t.stock_in_warehouse === value.stock_in_warehouse
                        ))
                    );

                    dialog_fields.push({
                        fieldname: 'stock_table',
                        fieldtype: 'Table',
                        label: 'Warehouse Stocks',
                        cannot_add_rows: true,
                        cannot_delete_rows: true,
                        fields: [
                            {
                                label: 'Select',
                                fieldname: 'select',
                                fieldtype: 'Check',
                                in_list_view: 1,
                                read_only: 0,
                                columns: 1
                            },
                            {
                                label: 'Item Name',
                                fieldname: 'item_name',
                                fieldtype: 'Data',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 3
                            },
                            {
                                label: 'Warehouse',
                                fieldname: 'warehouse',
                                fieldtype: 'Data',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 3
                            },
                            {
                                label: 'Warehouse Stock',
                                fieldname: 'stock_in_warehouse',
                                fieldtype: 'Float',
                                in_list_view: 1,
                                read_only: 1,
                                columns: 2
                            },
                            {
                                label: 'Enter qty',
                                fieldname: 'enter_qty',
                                fieldtype: 'Float',
                                in_list_view: 1,
                                read_only: 0,
                                columns: 2
                            }
                        ],
                        data: unique_warehouses.map(row => ({
                            item_name: row.item_name,
                            warehouse: row.warehouse,
                            stock_in_warehouse: row.stock_in_warehouse,
                            select: 0,
                            enter_qty: row.stock_in_warehouse
                        }))
                    });
                }

                let product_dialogue = new frappe.ui.Dialog({
                    title: 'Product Details',
                    size: 'large',
                    fields: dialog_fields,
                    primary_action_label: 'Ok',
                    primary_action() {
                           const dialog_values = product_dialogue.get_values();
    console.log("dv", dialog_values);
    
    if (dialog_values && dialog_values.stock_table) {
        const selected_rows = dialog_values.stock_table.filter(row => row.select);

        if (selected_rows.length === 0) {
            frappe.msgprint(__('Please select at least one warehouse.'));
            return;
        }
        
        console.log("sr", selected_rows);

        // First selected warehouse → update current row
        const first_row = selected_rows[0];
        frappe.model.set_value(row.doctype, row.name, 'source_warehouse', first_row.warehouse);
        frappe.model.set_value(row.doctype, row.name, 'qty', first_row.total_stock || 0);
        
        // The rest → create new rows
        for (let i = 1; i < selected_rows.length; i++) {
            let row_data = selected_rows[i];
            let new_row = frappe.model.add_child(frm.doc, 'Service DC OUT Items', 'items');
            frappe.model.set_value(new_row.doctype, new_row.name, 'item', row.item);
            frappe.model.set_value(new_row.doctype, new_row.name, 'source_warehouse', row_data.warehouse);
            frappe.model.set_value(new_row.doctype, new_row.name, 'qty', row_data.total_stock || 0);
        }

        frm.refresh_field('items');
        product_dialogue.hide();
    } else {
        console.log("⚠️ No stock_table data found or not rendered.");
    }

                    },
                    secondary_action_label: 'More Details',
                    secondary_action() {
                        product_dialogue.hide(); // Close the current dialog
                        fetch_more_details(product_dialogue, item, frm);
                    },
                });
                product_dialogue.show();
            } else {
                frappe.msgprint('No data found for the selected item.');
            }
        },
        error: function (err) {
            console.error("Error fetching product details:", err);
            frappe.msgprint('An error occurred while fetching product details.');
        }
    });

}


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
