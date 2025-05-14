frappe.ui.form.on('Sales Invoice', {
    refresh: function (frm) {
        frm.add_custom_button('Generate Label', async function () {
            // Prepare the data for the table
            let items = frm.doc.items.map((item, index) => {
                return {
                    item_code: item.item_code,
                    batch_no: item.batch_no || 'N/A',
                    warehouse: item.warehouse || 'N/A',
                    qty: item.qty || 0,
                    uom: item.uom || 'N/A',
                    index: index
                };
            });

            // Create the dialog box
            let d = new frappe.ui.Dialog({
                title: 'Item Details',
                fields: [
                    {
                        fieldname: 'item_table',
                        label: 'Items',
                        fieldtype: 'HTML'
                    }
                ]
            });

            // Generate the table HTML
            let table_html = `
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Item Code</th>
                            <th>Batch No</th>
                            <th>Warehouse</th>
                            <th>Qty</th>
                            <th>Quantity to Print</th>
                            <th>Print</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => `
                            <tr>
                                <td>${item.item_code}</td>
                                <td>${item.batch_no}</td>
                                <td>${item.warehouse}</td>
                                <td>${item.qty} ${item.uom}</td>
                                <td><input type="number" class="form-control print-qty" data-index="${index}" placeholder="Enter Qty" style="width: 100px;"></td>
                                <td><button class="btn btn-primary print-btn" data-index="${index}">Print</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            d.fields_dict.item_table.$wrapper.html(table_html);



            d.fields_dict.item_table.$wrapper.find('.print-btn').on('click', async function () {
                let index = $(this).data('index');
                let item = frm.doc.items[index];
                let total_qty = item.qty || 0;

                let print_qty = parseFloat(d.fields_dict.item_table.$wrapper.find(`.print-qty[data-index="${index}"]`).val()) || 0;
                // let print_copies = parseInt(prompt("Enter the number of copies:", "1")) || 1;

                console.log("Total Qty:", total_qty);
                console.log("Print Qty:", print_qty);
                console.log("Selected Line Item:", item);


                if (print_qty <= 0 || print_qty > parseFloat(total_qty)) {
                    frappe.msgprint("Please enter a valid quantity to print.");
                    return;
                }

                // Await the data from the function
                let data = await get_po_details(item.sales_order);
                console.log("PO Details:", data);
                let po_no = "N/A";
                let po_date = "N/A";
                if (data && data.length > 0) {
                    po_no = data[0].po_no;
                    po_date = data[0].po_date;
                }

                let full_label_count = Math.floor(total_qty / print_qty);
                let remainder_qty = total_qty - (full_label_count * print_qty);
                
                // Handle the case when the print_qty is equal to total_qty
                if (print_qty === total_qty) {
                    full_label_count = 1;
                    remainder_qty = 0;
                }
                
                // Handle the case when the print quantity matches the total quantity
                if (remainder_qty === 0 && full_label_count === 0 && print_qty === total_qty) {
                    full_label_count = 1;
                }

                // // Calculate the number of full labels and the remainder
                // let full_label_count = Math.floor(total_qty / print_qty);
                // let remainder_qty = total_qty % print_qty;

                // Generate print content with calculated labels
                let print_content = `
        <html>
            <head>
                <style>
@media print {
    body, html {
        margin: 0;
        padding: 0;
        width: 10cm;
        height: 5cm;
    }

    .label {
        width: 9.8cm;  /* slight margin for printer bleed */
        height: 4.8cm;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        font-size: 14.5px;  /* larger font */
        padding: 0.15cm;    /* very minimal padding */
        box-sizing: border-box;
        overflow: hidden;
        page-break-after: always;
        border: none;      /* optional: add border if needed */
    }

    .label p {
        margin: 1px 0;
        line-height: 1.2;
        font-size: 14.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    .label h3 {
        margin: 0 0 2px 0;
        font-size: 17px;
    }

    .invoice-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
        font-size: 13.5px;
        gap: 4px;
    }
}

                </style>
            </head>
            <body>
                ${Array(full_label_count).fill().map(() => `
                    <div class="label">
                       <p><b>Customer Part No.:</b> ${item.custom_customer_part_code ?? '--'}</p>
                        <p><b>Desc:</b> ${item.custom_customer_description ?? '--'}</p>
                        <p><b>Item Code:</b> ${item.item_code ?? '--'}</p>
                        <p><b>Batch No:</b> ${item.batch_no || '--'}</p>
                        <p><b>PO NO.:</b> ${po_no || '--'}</p>
                              <div class="invoice-row">
    <p><b>Invoice NO.:</b> ${frm.doc.name || '--'}</p>
    <p><b>Invoice Date:</b> ${frm.doc.posting_date || '--'}</p>
</div>
                        <p><b>Qty:</b> ${print_qty} ${item.uom || '--'}</p>
                    </div>
                `).join('')}
                ${remainder_qty > 0 ? `
                    <div class="label">
                        <p><b>Customer Part No.:</b> ${item.custom_customer_part_code ?? '--'}</p>
                        <p><b>Desc:</b> ${item.custom_customer_description ?? '--'}</p>
                        <p><b>Item Code:</b> ${item.item_code ?? '--'}</p>
                        <p><b>Batch No:</b> ${item.batch_no || '--'}</p>
                        <p><b>PO NO.:</b> ${po_no || '--'}</p>
    
                       <div class="invoice-row">
    <p><b>Invoice NO.:</b> ${frm.doc.name || '--'}</p>
    <p><b>Date:</b> ${frm.doc.posting_date || '--'}</p>
</div>
                        <p><b>Qty:</b> ${remainder_qty} ${item.uom || '--'}</p>
                    </div>
                ` : ''}
            </body>
        </html>
    `;

                let print_window = window.open('', '', 'height=600,width=800');
                print_window.document.write(print_content);
                print_window.document.close();
                print_window.print();
            });        
            d.show();
        }, 'Actions');
    }
});


async function get_po_details(sales_order) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: 'get_po_details_from_si',
            args: {
                sales_order: sales_order // Pass necessary arguments
            },
            callback: function (r) {
                if (r.message) {
                    console.log("Data fetched:", r.message);
                    resolve(r.message); // Resolve the promise with data
                } else {
                    reject("No data found");
                }
            }
        });
    });
}
