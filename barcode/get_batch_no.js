frappe.ui.form.on('Bar Code Generation', {
    refresh: function (frm) {
        frm.add_custom_button("View Stocks", function () {
            show_stock_details(frm);
        });

        frm.add_custom_button("Get Batch NO", function () {
            console.log(frm.doc);
            
            if (!frm.doc.item_code) {
                frappe.msgprint(__('Select Item Code'));
                return;
            }

            if (!frm.doc.location) {
                frappe.msgprint(__('Select Location'));
                return;
            }

            if (frm.doc.item_code && frm.doc.location) {
                get_batch_nos_for_item(frm);
            }
        });
    },

    item_code: function (frm) {
        get_item_defaults(frm);
    }
});


function show_stock_details(frm) {
    if (frm.doc.item_code) {
        frappe.call({
            method: 'get_product_details', // Replace with your server-side method for fetching PR history data
            args: {
                item_code: frm.doc.item_code // Pass necessary arguments
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
                            cannot_add_rows: true,
                            cannot_delete_rows: true,
                            fields: [
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
                                }
                            ],
                            data: unique_warehouses.map(row => ({
                                item_name: row.item_name,
                                warehouse: row.warehouse,
                                stock_in_warehouse: row.stock_in_warehouse
                            }))
                        });
                    }

                    // Open the dialog
                    let product_dialogue = new frappe.ui.Dialog({
                        title: 'Product Details',
                        size: 'large',
                        fields: dialog_fields,
                        primary_action_label: 'Cancel',
                        primary_action() {
                            product_dialogue.hide();
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
}

function get_batch_nos_for_item(frm) {
    frappe.call({
        method: "get_item_batch_no",
        args: {
            item_code: frm.doc.item_code,
            warehouse: frm.doc.location
        },
        callback: function (get_response) {
            console.log("Batch Nos:", get_response.message);
            if (get_response.message && Array.isArray(get_response.message)) {
                const batch_list = get_response.message;

                if (batch_list.length > 0) {
                    frm.clear_table("batch_nos");
                    batch_list.forEach((batch) => {
                        let row = frm.add_child("batch_nos");
                        row.batch_no = batch.batch_no;
                        row.qty = batch.batch_qty;
                    });

                    frm.refresh_field("batch_nos");
                } else {
                    frappe.msgprint(__('No batch numbers found for this location'));
                }
            } else {
                frappe.msgprint(__('No batch numbers found.'));
            }
        }
    });
}


function get_item_defaults(frm) {
    frappe.call({
        method: "get_item_detail_bar_code",
        args: {
            item_code: frm.doc.item_code
        },
        callback: function (get_response) {
            console.log("Item defaults:", get_response.message);
            if (get_response.message) {
                let uom = get_response.message[0].stock_uom ? get_response.message[0].stock_uom : "--";
                let name = get_response.message[0].item_name ? get_response.message[0].item_name : "--";

                frm.set_value("uom", uom);
                frm.set_value("item_name", name);
            }
        }
    });
}