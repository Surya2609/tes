frappe.ui.form.on('Sales Order Item', {
    // Trigger when the 'item_code' field is set (when an item is selected)
    custom_view: function (frm, cdt, cdn) {
        console.log("pressed");
        let item = locals[cdt][cdn];  // Correctly fetch the child table row
        if (frm.doc.customer && item.item_code) {
            // Call the server method to get the last purchase rates when item is selected
            frappe.call({
                method: 'get_delivernote_history',  // Replace with the correct path to your method
                args: {
                    item_code: item.item_code
                },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;  // Assign response to 'data'
                        console.log("--", data);  // Debugging output
                        // You can also update other fields or show messages
                        dn_dialogue_fetch(item, data, frm);  // Show the rates in the dialog                        
                    }
                }
            });
        }
    }
});

// Function to display the rates in a dialog
function dn_dialogue_fetch(item, data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML', // Use HTML to inject the scrollable table
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Last Delivery Note Summary',
        size: 'extra-large',
        fields: fields,
    });

    // Generate the scrollable table HTML
    const tableHTML = `
     <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
         <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
             <thead>
                 <tr style="background-color: #f9f9f9;">
                     <th style="padding: 10px; width: 120px;">Delivery Id</th>
                       <th style="padding: 10px; width: 120px;">Customer</th>
                     <th style="padding: 10px; width: 80px;">Date</th>
                     <th style="padding: 10px; width: 80px;">Rate</th>
                     <th style="padding: 10px; width: 80px;">Quantity</th>
                 </tr>
             </thead>
             <tbody>
                 ${data.map((record, index) => `
                     <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                         <td style="padding: 10px;">${record.name || ''}</td>
                          <td style="padding: 10px;">${record.customer || ''}</td>
                         <td style="padding: 10px;">${record.posting_date || ''}</td>
                          <td style="padding: 10px;" data-rate="${record.rate || ''}">${record.rate || ''}</td>
                         <td style="padding: 10px;">${record.qty || ''}</td>
                     </tr>`).join('')}
             </tbody>
         </table>
     </div>
 `;

    // Set the HTML content
    dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);


    // Add row selection functionality
    let selectedRow = null;
    dn_dialogue.$wrapper.find('.table-row').on('click', function () {
        // Remove highlight from the previously selected row
        if (selectedRow) {
            $(selectedRow).css('background-color', '');
        }

        // Highlight the clicked row
        selectedRow = this;
        $(selectedRow).css('background-color', '#d9f9d9'); // Light green background
    });

    // Add custom footer with buttons
    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <!-- Left Buttons -->
        <div class="left-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-secondary so-history-btn">SO History</button>
            <button class="btn btn-secondary product-details-btn">Product Details</button>
            <button class="btn btn-secondary more-details-btn">More Details</button>
        </div>
        <!-- Right Buttons -->
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
           
        </div>
    </div>
`;

    // Append the custom footer to the dialog
    dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    // Add event listeners for left buttons
    dn_dialogue.$wrapper.find('.so-history-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_so_history(dn_dialogue, item, frm);
    });

    dn_dialogue.$wrapper.find('.product-details-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_product_details(dn_dialogue, item);
    });

    dn_dialogue.$wrapper.find('.more-details-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_more_details(dn_dialogue, item, frm);
        ///////////////////////////////// fetch_product_details(dn_dialogue, item);
    });

    // Add event listeners for right buttons
    dn_dialogue.$wrapper.find('.ok-btn').on('click', function () {
        if (selectedRow) {
            // Get the rate from the selected row
            let selectedRate = $(selectedRow).find('td[data-rate]').data('rate');
            if (selectedRate) {
                frappe.model.set_value(item.doctype, item.name, 'rate', selectedRate);
                dn_dialogue.hide();
            } else {
                frappe.msgprint('Rate not available in the selected row.');
            }
        } else {
            frappe.msgprint('Please select a row first.');
        }
    });

    dn_dialogue.show();
}



function fetch_so_history(dn_dialogue, item, frm) {
    console.log("customer",frm.doc.customer);
    frappe.call({
        method: 'get_salesorder_history',  // Replace with your server-side method for fetching PR history data
        args: {
            item_code: item.item_code,
            customer: frm.doc.customer
        },
        callback: function (r) {
            if (r.message) {
                let data = r.message;  // Fetch the data for the new dialog
                console.log("New Data:", data);

                // Generate the scrollable table HTML
                const tableHTML = `
                     <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
                         <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
                             <thead>
                                 <tr style="background-color: #f9f9f9;">
                                     <th style="padding: 10px; width: 200px;">Sales Order</th>
                                     <th style="padding: 10px; width: 150px;">SO Qty</th>
                                     <th style="padding: 10px; width: 150px;">Delivered Qty</th>
                                     
                                     <th style="padding: 10px; width: 150px;">Date</th>
                                     <th style="padding: 10px; width: 150px;">Rate</th>
                                     <th style="padding: 10px; width: 200px;">Customer</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 ${data.map((record, index) => `
                                     <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                                         <td style="padding: 10px;">${record.name || ''}</td>
                                         <td style="padding: 10px;">${record.qty || ''}</td>
                                         <td style="padding: 10px;">${record.delivered_qty || ''}</td>
                                         <td style="padding: 10px;">${record.transaction_date || ''}</td>
                                          <td style="padding: 10px;" data-rate="${record.rate || ''}">${record.rate || ''}</td>
                                         <td style="padding: 10px;">${record.customer || ''}</td>
                                     </tr>`).join('')}
                             </tbody>
                         </table>
                     </div>
                 `;

                // Open the second dialog with the fetched data
                let so_dialogue = new frappe.ui.Dialog({
                    title: 'Last Sales Order Summary',
                    size: 'large',
                    fields: [
                        {
                            fieldname: 'rates',
                            fieldtype: 'HTML',  // Use HTML type to inject the table content
                        }
                    ],
                    //  primary_action_label: 'Close',
                    //  primary_action() {
                    //      po_dialogue.hide(); 
                    //  },
                    //  secondary_action_label: 'PR History',
                    //  secondary_action() {
                    //      po_dialogue.hide(); // Close the current dialog
                    //      dn_dialogue.show(); // Reopen the previous dialog
                    //  },
                });
                // Set the HTML content for the 'rates' field
                so_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

                // Add row selection functionality
                let selectedRow = null;
                so_dialogue.$wrapper.find('.table-row').on('click', function () {
                    // Remove highlight from the previously selected row
                    if (selectedRow) {
                        $(selectedRow).css('background-color', '');
                    }

                    // Highlight the clicked row
                    selectedRow = this;
                    $(selectedRow).css('background-color', '#d9f9d9'); // Light green background
                });

                // Add custom footer with buttons
                let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <!-- Left Buttons -->
        <div class="left-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-secondary dn-history-btn">DN History</button>
        </div>
        <!-- Right Buttons -->
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
            
        </div>
    </div>
`;

                // Append the custom footer to the dialog
                so_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

                // Add event listeners for left buttons
                so_dialogue.$wrapper.find('.dn-history-btn').on('click', function () {
                    so_dialogue.hide();
                    dn_dialogue.show();
                });

                // Add event listeners for right buttons
                so_dialogue.$wrapper.find('.ok-btn').on('click', function () {

                    if (selectedRow) {

                        // Get the rate from the selected row
                        let selectedRate = $(selectedRow).find('td[data-rate]').data('rate');
                        if (selectedRate) {
                            frappe.model.set_value(item.doctype, item.name, 'rate', selectedRate);
                            so_dialogue.hide();
                        } else {
                            frappe.msgprint('Rate not available in the selected row.');
                        }
                    } else {
                        frappe.msgprint('Please select a row first.');
                    }
                });

                so_dialogue.show();
            }
        }
    }
    );
}

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


// Function to fetch new data and open the second dialog
function fetch_product_details(dn_dialogue, item) {
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
                        // Display product details at the top
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
                                }
                            ],
                            data: pro_data.map(row => ({
                                item_name: row.item_name,
                                warehouse: row.warehouse,
                                stock_in_warehouse: row.stock_in_warehouse
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
                        dn_dialogue.show();
                    },
                });
                product_dialogue.show();
            }
        }
    });
}
