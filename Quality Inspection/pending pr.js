frappe.ui.form.on('Quality Inspection', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button(__('Pending PR'), function () {

                user_company = frm.doc.company;

                console.log(user_company);

                if(!user_company) {
                    frappe.msgprint('Company Not Set');
                    return;
                }

                frappe.call({
                    method: 'get_quality_pending_pr',
                    args: {
                        company_name: user_company
                    },
                    callback: function (r) {
                        if (r.message) {
                            let data = r.message;
                            console.log("--", data);
                            if (data.length != 0) {
                                open_pr_pending(data, frm);
                            } else {
                                frappe.msgprint('No Pending');
                            }
                        }
                    }
                });
            });
        }
    }
});

function open_pr_pending(data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Quality Pending PR',
        size: 'small',
        fields: fields,
    });

    const tableHTML = `
    <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
        <table class="scrollable-table" style="width: 50%; border-collapse: collapse; text-align: left; margin: auto;">
            <thead>
                <tr style="background-color: #f9f9f9;">
                    <th style="padding: 10px; min-width: 200px; white-space: nowrap;">Name</th>    
                    <th style="padding: 10px; min-width: 150px;">Supplier</th> 
                </tr>
            </thead>
            <tbody>
                ${data.map((record, index) => ` 
                    <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                        <td style="padding: 10px; white-space: nowrap; word-break: keep-all;">${record.name || ''}</td> 
                        <td style="padding: 10px;">${record.supplier || ''}</td> 
                    </tr>`).join('')}
            </tbody>
        </table>
    </div>
`;

    dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);

    let selectedRow = null;

    dn_dialogue.$wrapper.find('.table-row').on('click', function () {
        let rowIndex = $(this).attr('id').split('-')[1];

        if (selectedRow === rowIndex) {
            // Deselect if clicking the same row
            selectedRow = null;
            $(this).css('background-color', '');  // Remove background color
            $(this).css('color', '');  // Revert text color to default
        } else {
            // Deselect the previous selection
            dn_dialogue.$wrapper.find('.table-row').css('background-color', '');
            dn_dialogue.$wrapper.find('.table-row').css('color', '');  // Revert text color to default

            // Select the new row
            selectedRow = rowIndex;
            $(this).css('background-color', 'black');  // Set selected row to black
            $(this).css('color', 'white');  // Set text color to white
        }
    });

    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
        <div class="right-buttons" style="display: flex; gap: 10px;">
        <button class="btn btn-success ok-btn" style="background-color: black; color: white; border: none; padding: 10px 20px;">OK</button>    
        <button class="btn btn-success multiple_itm-btn" style="background-color: black; color: white; border: none; padding: 10px 20px;">Multiple Item</button>
        </div>
    </div>
    `;

    dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    dn_dialogue.$wrapper.find('.ok-btn').on('click', async function () {
        if (selectedRow !== null) {
            let selectedData = data[selectedRow];
            console.log("Selected Data:", selectedData);
            if (selectedData != null) {
                await fetch_pr_items(data, frm, selectedData, dn_dialogue, false);
            }
        } else {
            frappe.msgprint('Please select one row.');
        }
    });

    dn_dialogue.$wrapper.find('.multiple_itm-btn').on('click', async function () {
        if (selectedRow !== null) {
            let selectedData = data[selectedRow];
            console.log("Selected Data:", selectedData);
            if (selectedData != null) {
                await fetch_pr_items(data, frm, selectedData, dn_dialogue, true);
            }
        } else {
            frappe.msgprint('Please select one row.');
        }
    });
    dn_dialogue.show();
}

async function fetch_pr_items(data, frm, selectedData, dn_dialogue, is_multi) {
    try {
        // Fetch quality pending PR items
        const response = await frappe.call({
            method: 'get_quality_pending_pr_item',
            args: {
                parent_name: selectedData.name
            }
        });

        if (response.message) {
            let data = response.message;
            console.log("--", data);

            if (data.length === 0) {
                frappe.msgprint('No Items Found With Pending Inspection');
            } else {
                dn_dialogue.hide(); // Hide the dialogue

                if (is_multi == true) {
                    open_items_pr_for_multi_select(data, frm, selectedData);
                } else if (is_multi == false) {
                    open_items_pr(data, frm, selectedData);
                }
            }
        }
    } catch (error) {
        frappe.msgprint(__('An error occurred while fetching quality pending PR items: {0}', [error.message || error]));
        console.error("Error in on_pr_selected:", error);
    }
}

function open_items_pr(data, frm, selectedData) {
    let fields = [
        {
            fieldname: 'items',
            fieldtype: 'HTML',
        }
    ];

    let item_dialogue = new frappe.ui.Dialog({
        title: 'Item Code List',
        size: 'small',
        fields: fields,
    });

    const tableHTML = `
        <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
            <table class="scrollable-table" style="width: 90%; border-collapse: collapse; text-align: left; margin: auto;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; width: 50px;">Select</th>
                        <th style="padding: 10px; width: 150px;">Item Code</th>
                        <th style="padding: 10px; width: 150px;">Qty</th>                      
                    </tr>
                </thead>
                <tbody>
                    ${data.map((record, index) => ` 
                        <tr id="item-row-${index}">
                            <td style="text-align: center;">
                                <input type="checkbox" class="item-checkbox" data-index="${index}" style="width: 16px; height: 16px; cursor: pointer;">
                            </td>
                            <td style="padding: 10px;">${record.item_code || ''}</td>
                            <td style="padding: 10px;">${record.received_qty || ''}</td>                         
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
    item_dialogue.fields_dict.items.$wrapper.html(tableHTML);
    item_dialogue.$wrapper.find('.item-checkbox').on('change', function () {
        if ($(this).is(':checked')) {
            item_dialogue.$wrapper.find('.item-checkbox').not(this).prop('checked', false);
        }
    });
    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <button class="btn ok-btn" style="background-color: black; color: white; border-radius: 5px; padding: 8px 16px; border: none; cursor: pointer;">OK</button>
    </div>
    `;
    item_dialogue.$wrapper.find('.frappe-control[data-fieldname="items"]').append(customFooter);
    item_dialogue.$wrapper.find('.ok-btn').on('click', function () {
        let selectedItem = item_dialogue.$wrapper.find('.item-checkbox:checked');
        if (selectedItem.length === 0) {
            frappe.msgprint('Please select an item.');
            return;
        }
        let selectedIndex = selectedItem.data('index');
        let selectedDataItem = data[selectedIndex];

        frm.set_value("inspection_type", "Incoming");
        frm.set_value("reference_type", "Purchase Receipt");
        frm.set_value("reference_name", selectedData.name);
        frm.set_value("item_code", selectedDataItem.item_code);
        frm.set_value("custom_supplier",selectedData.supplier);
        console.log("Selected Item:", selectedDataItem);
        item_dialogue.hide();
    });
    item_dialogue.show();
}

function setting_value_pr(selectedDataItem, selectedData) {
    frm.set_value("inspection_type", "Incoming");
    frm.set_value("reference_type", "Purchase Receipt");
    frm.set_value("reference_name", selectedData.name);
    frm.set_value("item_code", selectedDataItem.item_code);
}

function open_items_pr_for_multi_select(data, frm, selectedData) {
    let fields = [
        {
            fieldname: 'items',
            fieldtype: 'HTML',
        }
    ];

    let item_dialogue = new frappe.ui.Dialog({
        title: 'Item Code List',
        size: 'small',
        fields: fields,
    });


    let headerMessage = `
    <div class="dialog-header-message" style="
        color: red; 
        font-size: 10px; 
        padding: 5px 10px;
        text-align: center;
    ">
        ⚠ Using this method, you will not be able to enter readings for this inspection unless you cancel and amend it.
    </div>
`;

    item_dialogue.$wrapper.find('.modal-title').append(headerMessage);

    const tableHTML = `
        <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
            <table class="scrollable-table" style="width: 90%; border-collapse: collapse; text-align: left; margin: auto;">
                <thead>
                    <tr style="background-color: #f9f9f9;">
                        <th style="padding: 10px; width: 50px;">
                            <input type="checkbox" id="select-all" checked>
                        </th>
                        <th style="padding: 10px; width: 150px;">Item Code</th>
                        <th style="padding: 10px; width: 150px;">Qty</th>
                        <th style="padding: 10px; width: 300px;">Description</th>
                        <th style="padding: 10px; width: 150px;">Deviate (Yes/No)</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((record, index) => ` 
                        <tr id="item-row-${index}">
                            <td style="text-align: center;">
                                <input type="checkbox" class="item-checkbox" id="checkbox-${index}" checked>
                            </td>
                            <td style="padding: 10px;">${record.item_code || ''}</td>
                             <td style="padding: 10px;">${record.received_qty || ''}</td>
                            <td style="padding: 10px;">
                                <input type="text" class="item-description" id="desc-${index}" style="width: 100%; padding: 5px;" placeholder="Enter description">
                            </td>
                            <td style="padding: 10px;">
                                <select class="item-deviate" id="deviate-${index}" style="width: 100%; padding: 5px;">
                                    <option value="NO" selected>No</option>
                                    <option value="YES">Yes</option>
                                </select>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;

    item_dialogue.fields_dict.items.$wrapper.html(tableHTML);

    // Handle "Select All" checkbox
    item_dialogue.$wrapper.find('#select-all').on('change', function () {
        let isChecked = $(this).is(':checked');
        item_dialogue.$wrapper.find('.item-checkbox').prop('checked', isChecked);
    });

    // Add custom footer with OK button
    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
        <button class="btn btn-dark ok-btn">OK</button>
    </div>
`;
    item_dialogue.$wrapper.find('.frappe-control[data-fieldname="items"]').append(customFooter);

    // Add click listener for OK button
    item_dialogue.$wrapper.find('.ok-btn').on('click', async function () {
        let acceptedAndDeviatedYes = [];
        let acceptedAndDeviatedNo = [];
        let rejectedItems = [];
        let valid = true;

        item_dialogue.$wrapper.find('.item-checkbox').each(function () {
            let rowIndex = $(this).attr('id').split('-')[1];
            let isChecked = $(this).is(':checked');
            let description = item_dialogue.$wrapper.find(`#desc-${rowIndex}`).val().trim();
            let deviated = item_dialogue.$wrapper.find(`#deviate-${rowIndex}`).val();

            if (!isChecked) {
                // Rejected Items
                if (!description) {
                    valid = false;
                    item_dialogue.$wrapper.find(`#desc-${rowIndex}`).css('border', '1px solid red'); // Highlight missing description
                } else {
                    item_dialogue.$wrapper.find(`#desc-${rowIndex}`).css('border', ''); // Reset border if valid
                }
                rejectedItems.push({
                    ...data[rowIndex],
                    description: description || '', // Include description from input field
                    deviated: deviated || 'No'
                });
            } else {
                // Accepted Items
                if (deviated === 'Yes') {
                    acceptedAndDeviatedYes.push({
                        ...data[rowIndex],
                        description: description || '', // Include description from input field
                        deviated: deviated
                    });
                } else {
                    acceptedAndDeviatedNo.push({
                        ...data[rowIndex],
                        description: description || '', // Include description from input field
                        deviated: deviated
                    });
                }
            }
        });

        // Validate before proceeding
        if (!valid) {
            frappe.msgprint('Please provide a description for all unselected items.');
            return;
        }

        if (acceptedAndDeviatedYes.length > 0) {
            // console.log("Accepted and Deviated = Yes:", acceptedAndDeviatedYes);
            await accept_qi_items(acceptedAndDeviatedYes, selectedData);
        }

        if (acceptedAndDeviatedNo.length > 0) {
            // console.log("Accepted and Deviated = No:", acceptedAndDeviatedNo);
            await accept_qi_items(acceptedAndDeviatedNo, selectedData);
        }

        if (rejectedItems.length > 0) {
            // console.log("Rejected Items:", rejectedItems);
            await rejected_qi_items(rejectedItems, selectedData);
        }

        if (acceptedAndDeviatedYes.length > 0 || acceptedAndDeviatedNo.length > 0 || rejectedItems.length > 0) {
            await update_quality_status(selectedData);
            item_dialogue.hide();
        }
    });
    item_dialogue.show();
}

async function update_purchase_receipt_warehouse(selectedData, item_code, { status }) {
    console.log("dsdas", selectedData);
    console.log("status", status);
    try {
        // Fetch the Purchase Receipt
        const purchaseReceiptResponse = await frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Purchase Receipt',
                name: selectedData.name,
            },
        });

        if (!purchaseReceiptResponse.message) {
            throw new Error('Failed to fetch Purchase Receipt.');
        }

        let purchase_receipt = purchaseReceiptResponse.message;
        console.log("this ischosj", purchase_receipt);

        let work_in_progress = "";
        let rejected_ware_house = "";


        const warehouses = await getDefaultCompanyWarehouses(frappe.session.user);
        work_in_progress = warehouses[0]?.custom_work_in_process;
        rejected_ware_house = warehouses[0]?.custom_rejected_item;


        purchase_receipt.items.forEach(item => {
            if (item.item_code === item_code) {
                if (status === 'Accepted') {
                    item.warehouse = work_in_progress;
                    item.custom_is_deviated = 'YES';
                    console.log("cust", item.custom_is_deviated);
                } else if (status === 'Rejected') {
                    item.custom_is_deviated = "RJI";
                    item.warehouse = rejected_ware_house;
                }
            }
        });

        // Save the updated Purchase Receipt
        console.log("pr receipt", purchase_receipt);
        const saveResponse = await frappe.call({
            method: 'frappe.client.save',
            args: {
                doc: purchase_receipt,
            },
        });

        if (!saveResponse.message) {
            throw new Error('Failed to save updated Purchase Receipt.');
        }

        console.log("Saved successfully");
        frappe.msgprint(__('Purchase Receipt updated successfully.'));

        
    } catch (error) {
        console.error("Error updating Purchase Receipt:", error.message);
        frappe.msgprint({
            title: __('Error'),
            message: __('Failed to update Purchase Receipt: {0}', [error.message]),
            indicator: 'red',
        });
    }
}

// }
async function rejected_qi_items(unselectedItems, selectedData) {
    for (const item of unselectedItems) {
        console.log("description", item.description);
        try {
            const insertResult = await frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Quality Inspection',
                        naming_series: 'MAT-QA-.YYYY.-', // Use the naming series
                        report_date: frappe.datetime.now_date(), // Dynamic report date
                        status: 'Rejected', // Status of the inspection
                        manual_inspection: 1,
                        inspection_type: 'Incoming',
                        reference_type: 'Purchase Receipt',
                        reference_name: selectedData.name, // Replace with your dynamic reference
                        item_code: item.item_code, // Item code
                        item_name: item.item_name, // Item name                       
                        remarks: item.description,
                        verified_by: frappe.session.user,
                        inspected_by: frappe.session.user, // Inspected by
                        quality_inspection_template: '', // Add a template if required
                        sample_size: 0, // Sample size if applicable
                    }
                }
            });

            if (insertResult.message) {
                // Submit the created Quality Inspection document
                const submitResult = await frappe.call({
                    method: 'frappe.client.submit',
                    args: {
                        doc: insertResult.message
                    }
                });

                if (submitResult.message) {
                    await update_purchase_receipt_warehouse(selectedData, item.item_code, { status: "Rejected" });
                    frappe.msgprint(__('Quality Inspection {0} created and submitted successfully.', [
                        `<a href="/app/quality-inspection/${submitResult.message.name}">${submitResult.message.name}</a>`
                    ]));

                }
            } else {
                frappe.msgprint(__('Failed to create Quality Inspection.'));
            }
        } catch (error) {
            frappe.msgprint(__('An error occurred: {0}', [error.message || error]));
        }
    }
}

async function accept_qi_items(selectedItems, selectedData) {
    for (const item of selectedItems) {
        try {
            // Insert the Quality Inspection document
            const insertResult = await frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Quality Inspection',
                        naming_series: 'MAT-QA-.YYYY.-', // Use the naming series
                        report_date: frappe.datetime.now_date(), // Dynamic report date
                        status: 'Accepted', // Status of the inspection
                        manual_inspection: 1,
                        inspection_type: 'Incoming',
                        reference_type: 'Purchase Receipt',
                        reference_name: selectedData.name, // Replace with your dynamic reference
                        item_code: item.item_code, // Item code
                        item_name: item.item_name, // Item name
                        custom_is_deviation: item.deviated,
                        remarks: item.description,
                        verified_by: frappe.session.user,
                        inspected_by: frappe.session.user, // Inspected by
                        quality_inspection_template: '', // Add a template if required
                        sample_size: 0, // Sample size if applicable
                    }
                }
            });

            if (insertResult.message) {
                const submitResult = await frappe.call({
                    method: 'frappe.client.submit',
                    args: {
                        doc: insertResult.message
                    }
                });
                if (submitResult.message) {
                    if (item.deviated === "YES") {
                        console.log("invoked");
                        await update_purchase_receipt_warehouse(selectedData, item.item_code, { status: "Accepted" });
                    }
                    frappe.msgprint(__('Quality Inspection {0} created and submitted successfully.', [
                        `<a href="/app/quality-inspection/${submitResult.message.name}">${submitResult.message.name}</a>`
                    ]));
                }
            } else {
                frappe.msgprint(__('Failed to create Quality Inspection.'));
            }
        } catch (error) {
            frappe.msgprint(__('An error occurred: {0}', [error.message || error]));
        }
    }
}

async function update_quality_status(selectedData) {
    try {
        const qiReqItemsResponse = await frappe.call({
            method: 'get_quality_pending_pr_item',
            args: {
                parent_name: selectedData.name
            }
        });
        let data = qiReqItemsResponse.message;
        console.log("data are here akjsdf", data);
        if (data.length === 0) {
            console.log("pr name", selectedData.name);
            const updateResponse = await frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Purchase Receipt',
                    name: selectedData.name,
                    fieldname: 'custom_quality_status',
                    value: 'Completed'
                }
            });
            if (!updateResponse.exc) {
                frappe.msgprint(__('Quality Completed status updated for Purchase Receipt'));
            }
        } else {
            console.log('Not all items have completed quality inspection');
        }
    } catch (error) {
        frappe.msgprint(__('An error occurred while updating the quality status: {0}', [error.message || error]));
        console.error("Error in update_quality_status:", error);
    }
}




function getDefaultCompanyWarehouses(user) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "get_default_company_warehouses",
            args: { user: user },
            callback: function (response) {
                const data = response.message;
                if (data && Array.isArray(data) && data.length > 0) {
                    resolve(data);
                } else {
                    reject("No data found for the user.");
                }
            },
            error: function (err) {
                reject(err);
            },
        });
    });
}


///// WANT TO ADD WARE HOUSE IN PURCHASE RECEIPT SIDE.............. 