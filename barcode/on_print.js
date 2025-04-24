frappe.ui.form.on('Bar Code Generation Child', {
    print: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        console.log("row", row);
        let g_qty = parseInt(row.split_qty) || 0;
        let total_qty = parseInt(row.qty) || 0;

        if (g_qty > 0) {
            if (total_qty < g_qty) {
                frappe.msgprint(__('Given Qty is Greater than Total Qty'));
            } else {
                let num_labels = Math.ceil(total_qty / g_qty);
                for (let i = 0; i < num_labels; i++) {
                    let current_qty = (i === num_labels - 1) ? total_qty % g_qty || g_qty : g_qty;
                    print_label(frm, row, current_qty);
                }
            }
        } else {
            print_label(frm, row, total_qty);
        }
    }
});

function print_label(frm, row, g_qty) {
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
            <div class="label-container">
                <div class="label-content">
                    Part Code: ${frm.doc.item_code}
                </div>
                <svg id="barcode1" class="barcode"></svg>
                <div class="item-name">
                    ${frm.doc.item_name}
                </div>
                <div class="label-content">
                    Location: ${frm.doc.location}
                </div>
                <div class="label-content">
                    Batch No: ${row.batch_no}
                </div>
                <svg id="barcode2" class="barcode"></svg>
                <div class="label-content">
                    Quantity: ${g_qty} ${frm.doc.uom}
                </div>
            </div>
            <script>
                // Generate Part Code Barcode
                JsBarcode("#barcode1", "${frm.doc.item_code}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
                // Generate Batch No Barcode
                JsBarcode("#barcode2", "${row.batch_no}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: false
                });
                window.print();
            </script>
        </body>
        </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
}



