frappe.ui.form.on('Delivery Note Item', {
    custom_view: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];  // Correctly fetch the child table row

        if (item.item_code) {
            frappe.call({
                method: 'get_product_details', // Replace with your server-side method for fetching PR history data
                args: {
                    item_code: item.item_code // Pass necessary arguments
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
});


function fetch_more_details(dn_dialogue, item, frm) {
    frappe.call({
        method: 'get_customer_part', // Updated method
        args: {
            item_code: item.item_code, // Pass necessary arguments
            customer: frm.doc.customer
        },
        callback: function (r) {
            if (r.message && r.message.length > 0) {
                let customer_data = r.message; // Fetch the data for the new dialog
                console.log("Customer Data:", customer_data);

                let customer_details = {
                    ref_code: customer_data[0].ref_code || "N/A",
                    custom_description: customer_data[0].custom_description || "N/A",
                    customer_name: customer_data[0].customer_name || "N/A",
                    item_tax_template: customer_data[0].item_tax_template || "N/A",
                    tax_category: customer_data[0].tax_category || "N/A",
                    valid_from: customer_data[0].valid_from || "N/A"
                };

                let customer_dialogue = new frappe.ui.Dialog({
                    title: 'More Details',
                    size: 'large',
                    fields: [
                        {
                            fieldname: 'More Details',
                            fieldtype: 'HTML',
                            options: `
                <div style="margin-bottom: 10px; font-family: Arial, sans-serif;">

                  <h2 style="font-family: Arial, sans-serif; color: #333;">Customer Part Details</h2>
                  <hr style="border: 1px solid #ccc; margin: 15px 0;">

                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Customer Code:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.ref_code}</div>
                  </div>

                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Description:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.custom_description}</div>
                  </div>

                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Customer Name:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.customer_name}</div>
                  </div>

                  <h2 style="font-family: Arial, sans-serif; color: #333;">Tax Details</h2>
                  <hr style="border: 1px solid #ccc; margin: 15px 0;">

                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Tax Template:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.item_tax_template}</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Tax Category:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.tax_category}</div>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                      <div style="font-weight: bold; width: 50%;">Valid From:</div>
                      <div style="text-align: left; width: 50%;">${customer_details.valid_from}</div>
                  </div>
                </div>
                `
                        },
                    ],
                    primary_action_label: 'Close',
                    primary_action() {
                        customer_dialogue.hide();
                    },
                    secondary_action_label: 'Back',
                    secondary_action() {
                        customer_dialogue.hide(); // Close the current dialog
                        dn_dialogue.show();
                    }
                });
                customer_dialogue.show();
            } else {
                // Handle empty or no data scenario
                frappe.msgprint({
                    title: __('No Data Found'),
                    message: __('No customer details found for the given item and customer.'),
                    indicator: 'orange'
                });
            }
        }
    });
}