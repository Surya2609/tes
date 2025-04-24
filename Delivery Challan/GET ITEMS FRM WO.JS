frappe.ui.form.on('Delivery Challan', {
    refresh: function (frm, cdt, cdn) {
        frm.add_custom_button("Work Order Pending", function () {
            frappe.call({
                method: 'get_wo_pending',
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;
                        console.log("--", data);
                        open_dialogue(data, frm);
                    }
                }
            });

        })
    }
});

// function open_dialogue(data, frm) {
//     let fields = [
//         {
//             fieldname: 'rates',
//             fieldtype: 'HTML',
//         }
//     ];

//     let dn_dialogue = new frappe.ui.Dialog({
//         title: 'Last Delivery Note Summary',
//         size: 'extra-large',
//         fields: fields,
//     });

//     const tableHTML = `
//         <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
//             <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
//                 <thead>
//                     <tr style="background-color: #f9f9f9;">
//                         <th style="padding: 10px; width: 120px;">Name</th>
//                         <th style="padding: 10px; width: 120px;">Item</th>
//                         <th style="padding: 10px; width: 120px;">Qty</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     ${data.map((record, index) => `
//                         <tr id="row-${index}" class="table-row" style="cursor: pointer;">
//                             <td style="padding: 10px;">${record.reference_id || ''}</td>
//                             <td style="padding: 10px;">${record.item || ''}</td>
//                             <td style="padding: 10px;">${record.remaining_qty || ''}</td>
//                         </tr>`).join('')}
//                 </tbody>
//             </table>
//         </div>
//     `;

//     dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

//     let selectedRows = [];

//     dn_dialogue.$wrapper.find('.table-row').on('click', function () {
//         let rowIndex = $(this).attr('id').split('-')[1];

//         if (selectedRows.includes(rowIndex)) {
//             selectedRows = selectedRows.filter(index => index !== rowIndex);
//             $(this).css('background-color', '');
//         } else {
//             selectedRows.push(rowIndex);
//             $(this).css('background-color', '#d9f9d9');
//         }
//     });

//     let customFooter = `
//     <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
//         <div class="right-buttons" style="display: flex; gap: 10px;">
//             <button class="btn btn-success ok-btn">OK</button>
//         </div>
//     </div>
//     `;

//     dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

//     dn_dialogue.$wrapper.find('.ok-btn').on('click', function () {
//         if (selectedRows.length > 0) {
//             let selectedData = selectedRows.map(rowIndex => data[rowIndex]);

//             // Group by item and merge reference_ids
//             let groupedItems = {};
//             selectedData.forEach(record => {
//                 if (!groupedItems[record.item]) {
//                     groupedItems[record.item] = {
//                         item: record.item,
//                         total_qty: parseFloat(record.remaining_qty) || 0, // Convert qty to number
//                         reference_ids: [record.reference_id] // Store reference_id as an array
//                     };
//                 } else {
//                     // Append reference_id for duplicate items
//                     groupedItems[record.item].reference_ids.push(record.reference_id);
//                     groupedItems[record.item].total_qty += parseFloat(record.remaining_qty) || 0; // Sum the quantities as numbers
//                 }
//             });

//             // Add grouped items to the child table
//             Object.values(groupedItems).forEach((groupedRecord) => {
//                 let newRow = frm.add_child('items');
//                 updateDeliveryStopRow(newRow, groupedRecord);
//             });

//             frm.refresh_field('items');
//             dn_dialogue.hide();
//         } else {
//             frappe.msgprint('Please select at least one row.');
//         }
//     });

//     dn_dialogue.show();
// }

// function updateDeliveryStopRow(row, groupedRecord) {
//     frappe.model.set_value(row.doctype, row.name, 'item', groupedRecord.item || '');
//     frappe.model.set_value(row.doctype, row.name, 'qty', groupedRecord.total_qty || ''); // Set total qty correctly
//     frappe.model.set_value(row.doctype, row.name, 'reference_id', groupedRecord.reference_ids.join(', ') || ''); // Grouped reference IDs
// }


function open_dialogue(data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Last Delivery Note Summary',
        size: 'extra-large',
        fields: fields,
    });

    const tableHTML = `
        <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
            <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; width: 120px;">Name</th>
                        <th style="padding: 10px; width: 120px;">Item</th>
                        <th style="padding: 10px; width: 120px;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((record, index) => `
                        <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                            <td style="padding: 10px;">${record.reference_id || ''}</td>
                            <td style="padding: 10px;">${record.item || ''}</td>
                            <td style="padding: 10px;">${record.remaining_qty || ''}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;

    dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

    let selectedRows = [];

    dn_dialogue.$wrapper.find('.table-row').on('click', function () {
        let rowIndex = $(this).attr('id').split('-')[1];

        if (selectedRows.includes(rowIndex)) {
            selectedRows = selectedRows.filter(index => index !== rowIndex);
            $(this).css('background-color', '');
        } else {
            selectedRows.push(rowIndex);
            $(this).css('background-color', '#d9f9d9');
        }
    });

    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
        </div>
    </div>
    `;

    dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    dn_dialogue.$wrapper.find('.ok-btn').on('click', function () {
        if (selectedRows.length > 0) {
            let selectedData = selectedRows.map(rowIndex => data[rowIndex]);

            // Group by item and merge reference_ids
            let groupedItems = {};
            selectedData.forEach(record => {
                if (!groupedItems[record.item]) {
                    groupedItems[record.item] = {
                        item: record.item,
                        total_qty: parseFloat(record.remaining_qty) || 0, // Convert qty to number
                        reference_ids: [{ id: record.reference_id, qty: record.remaining_qty }] // Store reference_id with qty
                    };
                } else {
                    // Append reference_id for duplicate items
                    groupedItems[record.item].reference_ids.push({ id: record.reference_id, qty: record.remaining_qty });
                    groupedItems[record.item].total_qty += parseFloat(record.remaining_qty) || 0; // Sum the quantities as numbers
                }
            });

            // Add grouped items to the child table
            Object.values(groupedItems).forEach((groupedRecord) => {
                let newRow = frm.add_child('items');
                updateDeliveryStopRow(newRow, groupedRecord);
                // frappe.meta.get_docfield("items", "qty", frm.docname).read_only = 1;
            });
                          
            frm.refresh_field('items');
            
            dn_dialogue.hide();
        } else {
            frappe.msgprint('Please select at least one row.');
        }
    });

    dn_dialogue.show();
}

function updateDeliveryStopRow(row, groupedRecord) {
    frappe.model.set_value(row.doctype, row.name, 'item', groupedRecord.item || '');
    frappe.model.set_value(row.doctype, row.name, 'qty', groupedRecord.total_qty || ''); // Set total qty correctly
    frappe.model.set_value(row.doctype, row.name, 'from', "WOP");
    // Format reference_id with qty in parentheses
    let formattedReferenceIds = groupedRecord.reference_ids
        .map(ref => `${ref.id}(${ref.qty})`)
        .join(', ');

    frappe.model.set_value(row.doctype, row.name, 'reference_id', formattedReferenceIds || ''); // Grouped reference IDs with qty
}