frappe.ui.form.on('Quality Inspection', {
    refresh: function (frm) {      
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button(__('Pending DN'), function () {

                frappe.db.get_list('Employee', {
                    filters: {
                        user_id: frappe.session.user
                    },
                    fields: ['company'],
                    limit_page_length: 1
                }).then((result) => {
                    console.log("res", result);
                    company = result[0].company;            

                    frappe.call({
                        method: 'get_quality_pending_dn',
                        args: {
                            company_name: company
                        },
                        callback: function (r) {
                            if (r.message) {
                                let data = r.message;
                                console.log("--", data);
                                if (data.length != 0) {
                                    open_dn_pending(data, frm);
                                } else {
                                    frappe.msgprint('No Pending');
                                }
                            }
                        }
                    });
                });             
            });
        }
    }
});

function open_dn_pending(data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Quality Pending DN',
        size: 'small',
        fields: fields,
    });

   const tableHTML = `
    <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
        <table class="scrollable-table" style="width: 50%; border-collapse: collapse; text-align: left; margin: auto;">
            <thead>
                <tr style="background-color: #f9f9f9;">
                    <th style="padding: 10px; min-width: 150px; white-space: nowrap;">Name</th> 
                    <th style="padding: 10px; min-width: 150px; white-space: nowrap;">Customer</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((record, index) => ` 
                    <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                        <td style="padding: 10px; white-space: nowrap; word-break: keep-all;">${record.name || ''}</td> 
                         <td style="padding: 10px; white-space: nowrap; word-break: keep-all;">${record.customer || ''}</td> 
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
            selectedRow = null;
            $(this).css('background-color', '');
            $(this).css('color', '');
        } else {
            dn_dialogue.$wrapper.find('.table-row').css('background-color', '');
            dn_dialogue.$wrapper.find('.table-row').css('color', '');
            selectedRow = rowIndex;
            $(this).css('background-color', 'black');
            $(this).css('color', 'white');
        }
    });

    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn" style="background-color: black; color: white; border: none; padding: 10px 20px;">OK</button>
        </div>
    </div>
    `;

    dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    dn_dialogue.$wrapper.find('.ok-btn').on('click', async function () {
        if (selectedRow !== null) {
            let selectedData = data[selectedRow];
            console.log("Selected Data:", selectedData);

            if (selectedData != null) {
                await fetch_dn_items(data, frm, selectedData, dn_dialogue);
            }
        } else {
            frappe.msgprint('Please select one row.');
        }
    });
    dn_dialogue.show();
}

async function fetch_dn_items(data, frm, selectedData, dn_dialogue) {
    try {
        const response = await frappe.call({
            method: 'get_quality_pending_dn_item',
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
                dn_dialogue.hide();
                open_items_dn(data, frm, selectedData);
            }
        }
    } catch (error) {
        frappe.msgprint(__('An error occurred while fetching quality pending PR items: {0}', [error.message || error]));
        console.error("Error in on_pr_selected:", error);
    }
}

function open_items_dn(data, frm, selectedData) {
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
                            <td style="padding: 10px;">${record.qty || ''}</td>                         
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
        setting_value(selectedDataItem, selectedData, frm);

        console.log("Selected Item:", selectedDataItem);
        item_dialogue.hide();
    });
    item_dialogue.show();
}

function setting_value(selectedDataItem, selectedData, frm) {
    frm.set_value("inspection_type", "Outgoing");
    frm.set_value("reference_type", "Delivery Note");
    frm.set_value("reference_name", selectedData.name);
    frm.set_value("item_code", selectedDataItem.item_code);
    frm.set_value("batch_no", selectedDataItem.batch_no);
    frm.set_value("custom_customer_name", selectedData.customer);
    frm.set_value("custom_customer_part_code", selectedData.custom_customer_part_code);
    setTimeout(() => {
        setting_reading_values(frm);
    }, 400);
}

function setting_reading_values(frm) {
    if (!frm.doc.item_code) {
        frappe.msgprint(__('Please select an item code first.'));
        return;
    }
    if (!frm.doc.batch_no) {
        frappe.msgprint(__('Please select a batch number.'));
        return;
    }
    // if (!frm.doc.quality_inspection_template) {
    //     frappe.msgprint(__('Please select a Quality Inspection Template.'));
    //     return;
    // }
    frappe.call({
        method: 'fetch_reading_frm_pr_quality',
        args: {
            batch_no: frm.doc.batch_no
        },
        callback: function (response) {
            if (response.message) {
                const data = response.message;
                console.log("reading output", response.message);
                console.log("frms", frm.doc);
                $.each(frm.doc.readings || [], function (index, row) {
                    console.log("roww", row);
                    $.each(data, function (i, template) {
                        if (row.specification === template.specification) {

                            for (let i = 1; i <= 10; i++) {
                                let reading_field = `reading_${i}`;
                                let reading_values = template[reading_field];
                                if (reading_values !== null) {
                                    frappe.model.set_value(row.doctype, row.name, reading_field, reading_values);
                                } else {
                                    frappe.model.set_value(row.doctype, row.name, reading_field, '');
                                }
                            }
                            frappe.model.set_value(row.doctype, row.name, "reading_value", template.reading_value);
                        }
                    });
                });

                frm.set_value("verified_by", data[0].verified_by);
                frm.set_value("remarks", data[0].remarks);
            } else {
                frappe.msgprint(__('No template found for this item code and batch number.'));
            }
        }
    });
}