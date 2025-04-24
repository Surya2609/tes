frappe.ui.form.on('Sales Order Item', {
    product_details: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if(item.item_code){
            fetch_product_details(item)
        }
    }
});

function fetch_product_details(item) {
    frappe.call({
        method: 'get_product_details',  // Replace with your server-side method for fetching PR history data
        args: {
            item_code: item.item_code// Pass necessary arguments
        },
        callback: function (r) {
            if (r.message) {
                let pro_data = r.message;  // Fetch the data for the new dialog
                console.log("New Data:", pro_data);

                let product_details = {
                    item_name: pro_data[0].item_name,
                    item_code: pro_data[0].item_code,
                    unit: pro_data[0].stock_uom,
                    total_stock: pro_data[0].total_stock
                };

                // Open the second dialog with the fetched data
                let product_dialogue = new frappe.ui.Dialog({
                    title: 'Product Details',
                    size: 'large',
                    fields: [
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
                        },
                        {
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
                                },

                                {
                                    label: 'Converted Uom Stock',
                                    fieldname: 'uom_stock',
                                    fieldtype: 'Float',
                                    in_list_view: 1,
                                    read_only: 1,
                                    columns: 2
                                }
                            ],
                            data: pro_data.map(row => ({
                                item_name: row.item_name,
                                warehouse: row.warehouse,
                                stock_in_warehouse: row.stock_in_warehouse,
                            }))
                        },
                    ],
                    primary_action_label: 'Cancel',
                    primary_action() {
                        product_dialogue.hide();
                    },
                    secondary_action_label: 'DN History',
                    secondary_action() {
                        product_dialogue.hide(); // Close the current dialog
                        // dn_dialogue.show();
                    },
                });
                product_dialogue.show();
            }
        }
    });
}