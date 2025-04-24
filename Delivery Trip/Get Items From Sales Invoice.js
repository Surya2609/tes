frappe.ui.form.on('Delivery Trip', {
    custom_get_items_from_sales_invoice: function (frm, cdt, cdn) {
        if (frm.doc.company) {
            frappe.call({
                method: 'get_sales_invoice_list',
                args: { company: frm.doc.company },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;
                        console.log("--", data);
                        open_dialogue(data, frm);
                    }
                }
            });
        }
    }
});

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
                        <th style="padding: 10px; width: 120px;">Company</th>
                        <th style="padding: 10px; width: 80px;">Customer</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((record, index) => `
                        <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                            <td style="padding: 10px;">${record.name || ''}</td>
                            <td style="padding: 10px;">${record.company || ''}</td>
                            <td style="padding: 10px;">${record.customer || ''}</td>
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
            console.log("Selected Data:", selectedData);

            // Process each selected record
            selectedData.forEach((record) => {
                // Find the first empty row in 'delivery_stops'
                let emptyRow = frm.doc.delivery_stops.find(row => !row.delivery_note && !row.custom_sales_invoice);
                if (emptyRow) {
                    updateDeliveryStopRow(emptyRow, record);
                } else {
                    let newRow = frm.add_child('delivery_stops');
                    updateDeliveryStopRow(newRow, record);
                }
            });
            frm.refresh_field('delivery_stops');
            dn_dialogue.hide();
        } else {
            frappe.msgprint('Please select at least one row.');
        }
    });

    dn_dialogue.show();
}


function updateDeliveryStopRow(row, record) {
    let name = 'delivery_note';
    record.name.startsWith('DN-') ? name = name : name = 'custom_sales_invoice';
    frappe.model.set_value(row.doctype, row.name, name, record.name || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_total_qty', record.total_qty || '');
    frappe.model.set_value(row.doctype, row.name, 'customer', record.customer || '');
}