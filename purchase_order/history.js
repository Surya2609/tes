frappe.ui.form.on('Purchase Order Item', {
    custom_view: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];  // Correctly fetch the child table row
        if (frm.doc.supplier && item.item_code) {
            frappe.call({
                // get_purchase_receipt
                method: 'get_purchase_receipt',  // Replace with the correct path to your method
                args: {
                    item_code: item.item_code
                },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;  // Assign response to 'data'
                        console.log("--", data);  // Debugging output
                        show_rate_dialog(frm, item, data);  // Show the rates in the dialog
                    }
                }
            });
        }
    }
});


function show_rate_dialog(frm, item, data) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML', // Use HTML to inject the scrollable table
        }
    ];

    let pr_dialogue = new frappe.ui.Dialog({
        title: 'Last Purchase Receipt Summary',
        size: 'extra-large',
        fields: fields
    });

    const tableHTML = `
    <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
        <table class="scrollable-table" style="width: 1500px; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background-color: #f9f9f9;">
                    <th style="padding: 10px; width: 200px;">Supplier</th>
                    <th style="padding: 10px; width: 200px;">Supplier Invoice</th>
                    <th style="padding: 10px; width: 200px;">SI Date</th>
                     <th style="padding: 10px; width: 100px;">Rate</th>
                    <th style="padding: 10px; width: 200px;">Purchase Receipt</th>
                    <th style="padding: 10px; width: 200px;">PO Id</th>
                    <th style="padding: 10px; width: 150px;">Date</th>
                    <th style="padding: 10px; width: 100px;">Quantity</th>
                    <th style="padding: 10px; width: 150px;">Received Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((record, index) => `
                    <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                        <td style="padding: 10px;">${record.supplier || ''}</td>
                        <td style="padding: 10px;">${record.supplier_delivery_note || ''}</td>
                        <td style="padding: 10px;">${record.custom_supplier_invoice_date || ''}</td>
                         <td style="padding: 10px;" data-rate="${record.rate || ''}">${record.rate || ''}</td>
                        <td style="padding: 10px;">${record.purchase_receipt_id || ''}</td>
                        <td style="padding: 10px;">${record.purchase_order_id || ''}</td>
                        <td style="padding: 10px;">${record.posting_date || ''}</td>
                        <td style="padding: 10px;">${record.qty || ''}</td>
                        <td style="padding: 10px;">${record.actual_qty || ''}</td>
                    </tr>`).join('')}
            </tbody>
        </table>
    </div>
`;

    // Set the HTML content for the table
    pr_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

    // Add row selection functionality
    let selectedRow = null;
    pr_dialogue.$wrapper.find('.table-row').on('click', function () {
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
            <button class="btn btn-secondary po-history-btn">PO History</button>
            <button class="btn btn-secondary product-details-btn">Product Details</button>
        </div>
        <!-- Right Buttons -->
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
          
        </div>
    </div>
`;

    // Append the custom footer to the dialog
    pr_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    // Add event listeners for left buttons
    pr_dialogue.$wrapper.find('.po-history-btn').on('click', function () {
        pr_dialogue.hide();
        fetch_po_history(pr_dialogue, item);
    });

    pr_dialogue.$wrapper.find('.product-details-btn').on('click', function () {
        pr_dialogue.hide();
        fetch_product_details(pr_dialogue, item);
    });

    // Add event listeners for right buttons
    pr_dialogue.$wrapper.find('.ok-btn').on('click', function () {
        if (selectedRow) {
            // Get the rate from the selected row
            let selectedRate = $(selectedRow).find('td[data-rate]').data('rate');
            if (selectedRate) {

                frappe.model.set_value(item.doctype, item.name, 'rate', selectedRate);
                pr_dialogue.hide();
            } else {
                frappe.msgprint('Rate not available in the selected row.');
            }
        } else {
            frappe.msgprint('Please select a row first.');
        }
    });

    // pr_dialogue.$wrapper.find('.close-btn').on('click', function () {
    //     // Clear item_code when close is pressed
    //     frappe.model.set_value(item.doctype, item.name, 'item_code', '');
    //     frappe.model.set_value(item.doctype, item.name, 'qty', '');
    //     frappe.model.set_value(item.doctype, item.name, 'uom', '');

    //     frappe.model.set_value(item.doctype, item.name, 'rate', '');
    //     frappe.model.set_value(item.doctype, item.name, 'amount', '');
    //     pr_dialogue.hide();
    // });

    // Show the dialog
    pr_dialogue.show();
}



function fetch_po_history(pr_dialogue, item) {
    frappe.call({
        method: 'get_purchase_order',  // Replace with your server-side method for fetching PR history data
        args: {
            item_code: item.item_code // Pass necessary arguments
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
                                    <th style="padding: 10px; width: 200px;">Purchase Order</th>
                                    <th style="padding: 10px; width: 200px;">Supplier</th>
                                    <th style="padding: 10px; width: 150px;">Date</th>
                                    <th style="padding: 10px; width: 150px;">Rate</th>
                                    <th style="padding: 10px; width: 150px;">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map((record, index) => `
                                    <tr id="row-${index}" class="table-rows" style="cursor: pointer;">
                                        <td style="padding: 10px;">${record.name || ''}</td>
                                        <td style="padding: 10px;">${record.supplier || ''}</td>
                                        <td style="padding: 10px;">${record.transaction_date || ''}</td>
                                        <td style="padding: 10px;" data-rate="${record.rate || ''}">${record.rate || ''}</td>
                                        <td style="padding: 10px;">${record.qty || ''}</td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

                // Open the second dialog with the fetched data
                let po_dialogue = new frappe.ui.Dialog({
                    title: 'Last Purchase Order Summary',
                    size: 'large',
                    fields: [
                        {
                            fieldname: 'rates',
                            fieldtype: 'HTML',  // Use HTML type to inject the table content
                        }
                    ],
                });
                // Set the HTML content for the 'rates' field
                po_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

                // Add row selection functionality
                let selectedRow = null;
                po_dialogue.$wrapper.find('.table-rows').on('click', function () {
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
            <button class="btn btn-secondary pr-history-btn">PR History</button>
        </div>
        <!-- Right Buttons -->
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
        </div>
    </div>
`;

                // Append the custom footer to the dialog
                po_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

                // Add event listeners for left buttons
                po_dialogue.$wrapper.find('.pr-history-btn').on('click', function () {
                    po_dialogue.hide();
                    pr_dialogue.show();
                });

                // Add event listeners for right buttons
                po_dialogue.$wrapper.find('.ok-btn').on('click', function () {
                    if (selectedRow) {
                        // Get the rate from the selected row
                        let selectedRate = $(selectedRow).find('td[data-rate]').data('rate');
                        if (selectedRate) {
                            // Update the rate in the Purchase Order form
                            frappe.model.set_value(item.doctype, item.name, 'rate', selectedRate);
                            po_dialogue.hide();
                        } else {
                            frappe.msgprint('Rate not available in the selected row.');
                        }
                    } else {
                        frappe.msgprint('Please select a row first.');
                    }
                });

                // po_dialogue.$wrapper.find('.close-btn').on('click', function () {
                //     // Clear item_code when close is pressed
                //     let doc = cur_frm.get_selected();
                //     frappe.model.set_value(item.doctype, item.name, 'item_code', '');
                //     frappe.model.set_value(item.doctype, item.name, 'qty', '');
                //     frappe.model.set_value(item.doctype, item.name, 'uom', '');
                //     frappe.model.set_value(item.doctype, item.name, 'rate', '');
                //     frappe.model.set_value(item.doctype, item.name, 'amount', '');
                //     po_dialogue.hide();
                // });


                po_dialogue.show();
            }
        }
    });
}

function fetch_product_details(pr_dialogue, item) {
    // First, call the 'get_product_details' API
    let dialog_fields = [];
    frappe.call({
        method: 'get_product_details',
        args: {
            item_code: item.item_code
        },
        callback: function (r) {
            if (r.message && r.message.length > 0) {
                let pro_data = r.message;
                console.log("Product Data:", pro_data);

                let product_details = {
                    item_name: pro_data[0].item_name,
                    item_code: pro_data[0].item_code,
                    unit: pro_data[0].stock_uom,
                    total_stock: pro_data[0].total_stock,
                    is_asset: pro_data[0].is_asset // Check if the item is an asset
                };

                // Define dialog fields conditionally
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

                // Collect and display warehouse details
                let unique_warehouses = pro_data.filter((value, index, self) =>
                    index === self.findIndex((t) => (
                        t.warehouse === value.warehouse && t.stock_in_warehouse === value.stock_in_warehouse
                    ))
                );

                dialog_fields.push({
                    fieldname: 'warehouse_details',
                    fieldtype: 'Table',
                    cannot_add_rows: true,
                    cannot_delete_rows: true,
                    fields: [
                        {
                            label: 'Warehouse',
                            fieldname: 'warehouse',
                            fieldtype: 'Data',
                            in_list_view: 1,
                            read_only: 1,
                            columns: 4
                        },
                        {
                            label: 'Stock in Warehouse',
                            fieldname: 'stock_in_warehouse',
                            fieldtype: 'Float',
                            in_list_view: 1,
                            read_only: 1,
                            columns: 4
                        }
                    ],
                    data: unique_warehouses.map(row => ({
                        warehouse: row.warehouse,
                        stock_in_warehouse: row.stock_in_warehouse
                    }))
                });

                frappe.call({
                    method: 'get_product_summary', // Replace with the correct API method for fetching product summary
                    args: {
                        item_code: item.item_code // Pass the same item code for fetching sales data
                    },
                    callback: function (summary_response) {
                        console.log("summary",summary_response.message);
                        if (summary_response.message.length !== 0) {
                            console.log("product summary",summary_response.message);
                            let data = summary_response.message;
                            let pendingSalesOrdersCount = data.total_pending_sales_orders || 0;
                            let lastFourMonths = [];

                            let today = new Date();
                            for (let i = 3; i >= 0; i--) {
                                let monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                                lastFourMonths.push({
                                    sale_month: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                                    total_quantity_sold: 0
                                });
                            }

                            // Add average quantities below the table
                            let averageQtyCurrentYear = 0;
                            let averageQtyLastYear = 0;

                            // Map sales data to the last four months, setting missing months to 0 quantity
                            data.forEach((sales) => {
                                console.log(sales.average_qty_current_year);
                                averageQtyCurrentYear = sales.average_qty_current_year;
                                averageQtyLastYear = sales.avg_qty_last_year;
                                let saleMonthFormatted = new Date(sales.sale_month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
                                let monthData = lastFourMonths.find(m => m.sale_month === saleMonthFormatted);
                                if (monthData) {
                                    monthData.total_quantity_sold = sales.total_quantity_sold || 0;
                                }
                            });

                            // Add the Product Sales Details table to dialog fields
                            dialog_fields.push({
                                fieldname: 'product_sales_details',
                                fieldtype: 'Table',
                                cannot_add_rows: true,
                                cannot_delete_rows: true,
                                fields: [
                                    {
                                        label: 'Sale Month',
                                        fieldname: 'sale_month',
                                        fieldtype: 'Data',
                                        in_list_view: 1,
                                        read_only: 1,
                                        columns: 4
                                    },
                                    {
                                        label: 'Total Quantity Sold',
                                        fieldname: 'total_quantity_sold',
                                        fieldtype: 'Int',
                                        in_list_view: 1,
                                        read_only: 1,
                                        columns: 4
                                    }
                                ],
                                data: lastFourMonths
                            });

                //             // Add average quantities and pending sales orders as HTML
                            dialog_fields.push({
                                fieldname: 'average_quantities',
                                fieldtype: 'HTML',
                                options: `
                   <div style="margin-top: 10px; font-family: Arial, sans-serif;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <div style="font-weight: bold; width: 60%;">Average Quantity (Current Year):</div>
                            <div style="text-align: left; width: 40%;">${averageQtyCurrentYear}</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <div style="font-weight: bold; width: 60%;">Average Quantity (Last Year):</div>
                            <div style="text-align: left; width: 40%;">${averageQtyLastYear}</div>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <div style="font-weight: bold; width: 60%;">Sales Order Pending:</div>
                            <div style="text-align: left; width: 40%;">${pendingSalesOrdersCount}</div>
                        </div>
                   </div>
                `
                            });

                            // // Open the dialog
                            // let product_dialogue = new frappe.ui.Dialog({
                            //     title: 'Product Details',
                            //     size: 'large',
                            //     fields: dialog_fields,
                            //     primary_action_label: 'Cancel',
                            //     primary_action() {
                            //         product_dialogue.hide();
                            //     },
                            //     secondary_action_label: 'PR History',
                            //     secondary_action() {
                            //         product_dialogue.hide(); // Close the current dialog
                            //         pr_dialogue.show();
                            //     },
                            // });
                            // product_dialogue.show();
                        } 
                        // else {
                        //     frappe.msgprint('No product sales data found.');
                        // }


                        let product_dialogue = new frappe.ui.Dialog({
                            title: 'Product Details',
                            size: 'large',
                            fields: dialog_fields,
                            primary_action_label: 'Cancel',
                            primary_action() {
                                product_dialogue.hide();
                            },
                            secondary_action_label: 'PR History',
                            secondary_action() {
                                product_dialogue.hide(); // Close the current dialog
                                pr_dialogue.show();
                            },
                        });
                        product_dialogue.show();
                    },
                    error: function (err) {
                        console.error("Error fetching product sales summary:", err);
                        frappe.msgprint('An error occurred while fetching product sales data.');
                    }
                });
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


