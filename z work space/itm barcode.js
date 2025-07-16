frappe.ui.form.on('Item', {
    refresh: function (frm) {
        frm.add_custom_button('Generate Barcode', function () {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Item Price",
                    filters: {
                        item_code: frm.doc.item_code,
                        selling: 1
                    },
                    fieldname: ["price_list_rate"]
                },
                callback: function (res) {
                    let item_price = res.message ? res.message.price_list_rate : "0.00";

                    let size = "", color = "";
                    (frm.doc.attributes || []).forEach(attr => {
                        if (attr.attribute === "PRASHANTHI FASHIONS SIZE") size = attr.attribute_value;
                        if (attr.attribute === "PRASHANTHI FASHIONS COLOR") color = attr.attribute_value;
                    });

                    let company_name = (frm.doc.item_defaults && frm.doc.item_defaults.length > 0)
                        ? frm.doc.item_defaults[0].company
                        : "PRASHANTHI FASHIONS LLP";

                    let ref_no = (frm.doc.custom_ref_no || frm.doc.item_code || "")
                        .replace(/[^A-Za-z0-9\-]/g, '')
                        .toUpperCase();

                    if (!ref_no) {
                        frappe.msgprint(__('Reference Number or Item Code is missing for barcode.'));
                        return;
                    }

                    let item = {
                        company: company_name,
                        price: frm.doc.valuation_rate || "0.00",
                        rate: item_price || "0.00",
                        color: color || "-",
                        size: size || "-",
                        ref_no: ref_no
                    };

                    print_item_label(item, 1);
                }
            });
        });
    }
});

function print_item_label(item, print_qty) {
    const printWindow = window.open('', '', 'height=600,width=900');

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
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                }
                .label-container {
                    width: 10cm;
                    height: 5cm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    box-sizing: border-box;
                    page-break-after: always;
                }
                .company {
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                    width: 100%;
                }
                .details {
                    font-size: 12px;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    margin-top: 5px;
                }
                .barcode {
                    width: 90%;
                    height: 50px;
                    margin-top: 10px;
                }
                .ref-no {
                    text-align: center;
                    font-size: 12px;
                    margin-top: 4px;
                    font-weight: bold;
                }
            }
        </style>
    </head>
    <body>
    `;

    for (let i = 0; i < print_qty; i++) {
        content += `
            <div class="label-container">
                <div class="company">${item.company}</div>
                <div class="details">
                    <div>MRP: ₹${item.price} <br> Size: ${item.size}</div>
                    <div>Rate: ₹${item.rate} <br> Color: ${item.color}</div>
                </div>
                <svg class="barcode" id="barcode_${i}"></svg>
                <div class="ref-no">${item.ref_no}</div>
            </div>
        `;
    }

    content += `
        <script>
            for (let i = 0; i < ${print_qty}; i++) {
                JsBarcode("#barcode_" + i, "${item.ref_no}", {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 50,
                    displayValue: false,
                    margin: 0,
                    flat: true
                });
            }

            window.onload = function() {
                setTimeout(() => window.print(), 500);
            };
        <\/script>
    </body>
    </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
}


// function print_item_label(item, print_qty) {
//     const printWindow = window.open('', '', 'height=600,width=900');

//     let content = `
//     <html>
//     <head>
//         <title>Print Label</title>
//         <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
//         <style>
//             @media print {
//                 @page {
//                     size: 10cm 5cm;
//                     margin: 0;
//                 }
//                 body {
//                     margin: 0;
//                     padding: 0;
//                     font-family: Arial, sans-serif;
//                 }
//                 .label-container {
//                     width: 10cm;
//                     height: 5cm;
//                     box-sizing: border-box;
//                     padding: 10px 15px;
//                     display: flex;
//                     flex-direction: column;
//                     justify-content: flex-start;
//                     align-items: stretch;
//                     page-break-after: always;
//                     overflow: hidden;
//                 }
//                 .company {
//                     text-align: center;
//                     font-size: 16px;
//                     font-weight: bold;
//                 }
//                 .subtitle {
//                     text-align: center;
//                     font-size: 14px;
//                     margin-top: 2px;
//                     font-weight: normal;
//                 }
//                 .details {
//                     display: flex;
//                     justify-content: space-between;
//                     font-size: 14px;
//                     margin-top: 8px;
//                     font-weight: normal;
//                 }
//                 .barcode {
//                     margin: 6px auto;
//                     height: 45px;
//                     width: 100%;
//                 }
//                 .ref-no {
//                     text-align: center;
//                     font-size: 14px;
//                     font-weight: bold;
//                     margin-top: 4px;
//                 }
//             }
//         </style>
//     </head>
//     <body>
//     `;

//     for (let i = 0; i < print_qty; i++) {
//         content += `
//             <div class="label-container">
//                 <div class="company">${item.company}</div>
//                 <div class="subtitle">KIDS WEAR</div>
//                 <div class="details">
//                     <div>MRP: ₹${item.price}<br>Size: ${item.size}</div>
//                     <div>Rate: ₹${item.rate}<br>Color: ${item.color}</div>
//                 </div>
//                 <svg class="barcode" id="barcode_${i}"></svg>
//                 <div class="ref-no">Ref. No: ${item.ref_no}</div>
//             </div>
//         `;
//     }

//     content += `
//         <script>
//             for (let i = 0; i < ${print_qty}; i++) {
//                 JsBarcode("#barcode_" + i, "${item.ref_no}", {
//                     format: "CODE128",
//                     lineColor: "#000",
//                     width: 2,
//                     height: 45,
//                     displayValue: false
//                 });
//             }
//             window.onload = function() {
//                 window.print();
//             };
//         <\/script>
//     </body>
//     </html>
//     `;

//     printWindow.document.write(content);
//     printWindow.document.close();
// }
