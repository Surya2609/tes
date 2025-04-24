frappe.ui.form.on("Delivery Challan", {
    refresh: function (frm) {
        if (frm.doc.dc_type === "IN") {
            frm.add_custom_button("Pending DC Out", function () {
                frappe.call({
                    method: 'get_dc_out_pending',
                    callback: function (r) {
                        if (r.message) {
                            let data = r.message;
                            console.log("--", data);
                            show_dc_dialogue(data, frm);
                            // open_dc_pending(data, frm);
                        }
                    }
                });
            })       
        }
    }
});

function show_dc_dialogue(data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Pending DC',
        size: 'extra-large',
        fields: fields,
    });

    const tableHTML = `
        <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
            <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; width: 120px;">DC Name</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...new Set(data.map(record => record.dc_name))].map((dc_name, index) => `
                        <tr id="dc-row-${index}" class="dc-table-row" style="cursor: pointer;">
                            <td style="padding: 10px;">${dc_name || ''}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;

    dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

    dn_dialogue.$wrapper.find('.dc-table-row').on('click', function () {
        let selectedIndex = $(this).attr('id').split('-')[2];
        let selectedDcName = [...new Set(data.map(record => record.dc_name))][selectedIndex];

        // Find items related to selected DC Name
        let filteredItems = data.filter(record => record.dc_name === selectedDcName);
        
        dn_dialogue.hide(); // Hide the DC dialog
        show_items_dialogue(filteredItems, dn_dialogue, frm); // Open item selection dialog
    });

    dn_dialogue.show();
}

// Function to show items for selected DC
function show_items_dialogue(itemsData, parentDialog, frm) {
    let itemDialog = new frappe.ui.Dialog({
        title: `Items in ${itemsData[0].dc_name}`,
        size: 'large',
        fields: [
            {
                fieldname: 'items_list',
                fieldtype: 'HTML',
            }
        ]
    });

    const itemTableHTML = `
        <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
            <table class="scrollable-table" style="width: 800px; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; width: 120px;">Item</th>
                        <th style="padding: 10px; width: 120px;">Qty</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsData.map((item, index) => `
                        <tr id="item-row-${index}" class="item-table-row" style="cursor: pointer;">
                            <td style="padding: 10px;">${item.item || ''}</td>
                            <td style="padding: 10px;">${item.qty || ''}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;

    itemDialog.fields_dict.items_list.$wrapper.html(itemTableHTML);

    let selectedItemIndex = null;

    itemDialog.$wrapper.find('.item-table-row').on('click', function () {
        if (selectedItemIndex !== null) {
            $(`#item-row-${selectedItemIndex}`).css('background-color', '');
        }

        selectedItemIndex = $(this).attr('id').split('-')[2];
        $(this).css('background-color', '#d9f9d9');
    });

    let customFooter = `
        <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
            <button class="btn btn-primary back-btn">Back</button>
            <button class="btn btn-success ok-btn">OK</button>
        </div>
    `;

    itemDialog.$wrapper.find('.frappe-control[data-fieldname="items_list"]').append(customFooter);

    // Back button to return to DC dialog
    itemDialog.$wrapper.find('.back-btn').on('click', function () {
        itemDialog.hide();
        parentDialog.show();
    });

    // OK button to select item
    itemDialog.$wrapper.find('.ok-btn').on('click', function () {
        if (selectedItemIndex !== null) {
            let selectedItem = itemsData[selectedItemIndex];
            let newRow = frm.add_child('items');
            frappe.model.set_value(newRow.doctype, newRow.name, 'item', selectedItem.item || '');
            frappe.model.set_value(newRow.doctype, newRow.name, 'qty', parseFloat(selectedItem.qty) || 0);
            frappe.model.set_value(newRow.doctype, newRow.name, 'from', "OUT");
            frappe.model.set_value(newRow.doctype, newRow.name, 'reference_id', selectedItem.reference_id || '');
            frm.refresh_field('items');
            itemDialog.hide();
            parentDialog.show();
        } else {
            frappe.msgprint('Please select an item.');
        }
    });

    itemDialog.show();
}


// function open_dc_pending(data, frm) {
//     let fields = [
//         {
//             fieldname: 'rates',
//             fieldtype: 'HTML',
//         }
//     ];

//     let dn_dialogue = new frappe.ui.Dialog({
//         title: 'Pending DC',
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
//                             <td style="padding: 10px;">${record.name || ''}</td>
//                             <td style="padding: 10px;">${record.item || ''}</td>
//                             <td style="padding: 10px;">${record.dc_out_qty || ''}</td>
//                         </tr>`).join('')}
//                 </tbody>
//             </table>
//         </div>
//     `;

//     dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

//     let selectedRow = null;

//     dn_dialogue.$wrapper.find('.table-row').on('click', function () {
//         // Remove background color from previously selected row
//         if (selectedRow !== null) {
//             $(`#row-${selectedRow}`).css('background-color', '');
//         }

//         // Get new selected row index
//         selectedRow = $(this).attr('id').split('-')[1];

//         // Apply background color to the new selected row
//         $(this).css('background-color', '#d9f9d9');
//     });

//     let customFooter = `
//         <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
//             <div class="right-buttons" style="display: flex; gap: 10px;">
//                 <button class="btn btn-success ok-btn">OK</button>
//             </div>
//         </div>
//     `;

//     dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

//     dn_dialogue.$wrapper.find('.ok-btn').on('click', function () {
//         if (selectedRow !== null) {
//             let selectedRecord = data[selectedRow];
    
//             // Prepare item to add
//             let newRow = frm.add_child('items');
    
//             // Directly set values without grouping
//             frappe.model.set_value(newRow.doctype, newRow.name, 'item', selectedRecord.item || '');
//             frappe.model.set_value(newRow.doctype, newRow.name, 'qty', parseFloat(selectedRecord.dc_out_qty) || 0);
//             frappe.model.set_value(newRow.doctype, newRow.name, 'from', "OUT");
//             frappe.model.set_value(newRow.doctype, newRow.name, 'reference_id', selectedRecord.name || '');
    
//             frm.refresh_field('items');
//             dn_dialogue.hide();
//         } else {
//             frappe.msgprint('Please select a row.');
//         }
//     });

//     dn_dialogue.show();
// }

// function update_field_dc(row, groupedRecord) {
//     frappe.model.set_value(row.doctype, row.name, 'item', groupedRecord.item || '');
//     frappe.model.set_value(row.doctype, row.name, 'qty', groupedRecord.qty || ''); // Set total qty correctly
//     frappe.model.set_value(row.doctype, row.name, 'from', "OUT");
//     // Format reference_id with qty in parentheses
//     let formattedReferenceIds = groupedRecord.reference_ids
//         .map(ref => `${ref.id}(${ref.qty})`)
//         .join(', ');
//     frappe.model.set_value(row.doctype, row.name, 'reference_id', formattedReferenceIds || ''); // Grouped reference IDs with qty
// }