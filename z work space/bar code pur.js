frappe.ui.form.on('Purchase Receipt', {
    refresh: function (frm) {
        frm.add_custom_button('Generate Barcode', function () {
            let items = frm.doc.items.map((item, index) => {
                return {
                    item_code: item.item_code,
                    batch_no: item.custom_item_batch_no || 'N/A',
                    warehouse: item.warehouse || 'N/A',
                    qty: item.qty || 0,
                    uom: item.uom || 'N/A',
                    index: index
                };
            });

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

            // Attach Print Button Event
            d.fields_dict.item_table.$wrapper.find('.print-btn').on('click', function () {
                let index = $(this).data('index');
                let item = frm.doc.items[index];
                let total_qty = item.qty || 0;
                let print_qty = parseFloat(d.fields_dict.item_table.$wrapper.find(`.print-qty[data-index="${index}"]`).val()) || 0;

                console.log("Total Qty:", total_qty);
                console.log("Print Qty:", print_qty);
                console.log("Selected Line Item:", item);


                if (print_qty <= 0 || print_qty > parseFloat(total_qty)) {
                    frappe.msgprint("Please enter a valid quantity to print.");
                    return;
                }

                let full_label_count = Math.floor(total_qty / print_qty);
                let remainder_qty = total_qty % print_qty;

                // Handle the case when the print_qty is equal to total_qty
                if (print_qty === total_qty) {
                    full_label_count = 1;
                    remainder_qty = 0;
                }

                // Adjust the remainder when the print quantity is a decimal value
                if (remainder_qty > 0 && remainder_qty < 1) {
                    remainder_qty = parseFloat(remainder_qty.toFixed(2)); // Handle decimal precision
                }

                print_label(item, print_qty, full_label_count, remainder_qty);
            });

            d.show();
        }, 'Actions');
    }
});

function print_label(row, print_qty, full_label_count, remainder_qty) {
    const printWindow = window.open('', '', 'height=500,width=800');
    let content = `
        <html>
        <head>
            <title>Print Label</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                @media print {
                    @page {
                        size: 10cm 5cm;
                        margin: 0;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        padding: 0;
                        margin: 0;
                    }
                    .label-container {
                        width: 10cm;
                        height: 5cm;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: flex-start;
                        border: 1px solid black;
                        text-align: left;
                        padding: 8px;
                        box-sizing: border-box;
                        page-break-after: always;
                    }
                    .label-content {
                        font-size: 14px;
                        margin: 2px 0;
                        font-weight: bold;
                    }
                    .barcode {
                        margin: 2px 0;
                        width: 100%;
                    }
                    .item-name {
                        font-size: 12px;
                        margin: 2px 0;
                        font-weight: normal;
                    }
                }
            </style>
        </head>
        <body>
    `;
 
    // Generate Full Label Copies
    for (let i = 0; i < full_label_count; i++) {
        content += `
            <div class="label-container">
                <div class="label-content">
                    Part Code: ${row.item_code}
                </div>
                <svg class="barcode" id="barcode1_${i}"></svg>
                <div class="item-name">
                    ${row.item_name || 'N/A'}
                </div>
                <div class="label-content">
                    Location: ${row.warehouse}
                </div>
                <div class="label-content">
                    Batch No: ${row.custom_item_batch_no || 'N/A'}
                </div>
                <svg class="barcode" id="barcode2_${i}"></svg>
                <div class="label-content">
                    Quantity: ${print_qty} ${row.uom || ''}
                </div>
            </div>
        `;
    }

    // Generate Remainder Label if any
    if (remainder_qty > 0) {
        content += `
            <div class="label-container">
                <div class="label-content">
                    Part Code: ${row.item_code}
                </div>
                <svg class="barcode" id="barcode1_remainder"></svg>
                <div class="item-name">
                    ${row.item_name || 'N/A'}
                </div>
                <div class="label-content">
                    Location: ${row.warehouse}
                </div>
                <div class="label-content">
                    Batch No: ${row.custom_item_batch_no || 'N/A'}
                </div>
                <svg class="barcode" id="barcode2_remainder"></svg>
                <div class="label-content">
                    Quantity: ${remainder_qty} ${row.uom || ''}
                </div>
            </div>
        `;
    }

    content += `
        <script>
            // Generate Barcodes for Full Label Copies
            for (let i = 0; i < ${full_label_count}; i++) {
                JsBarcode("#barcode1_" + i, "${row.item_code}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
                JsBarcode("#barcode2_" + i, "${row.custom_item_batch_no || 'N/A'}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
            }

            // Generate Barcode for Remainder Label
            if (${remainder_qty} > 0) {
                JsBarcode("#barcode1_remainder", "${row.item_code}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
                JsBarcode("#barcode2_remainder", "${row.custom_item_batch_no || 'N/A'}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
            }

            // Print after barcode generation
            window.onload = function() {
                window.print();
            };
        </script>
        </body>
        </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
}