frappe.ui.form.on('Delivery Trip', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button('Get Items from Sales Invoice', () => {
                frappe.call({
                    method: 'get_sales_invoice_list',
                    args: { company: frm.doc.company },
                    callback: function (r) {
                        if (r.message) {
                            let data = r.message;
                            open_dialogue(data, frm);
                        }
                    }
                });
            });
        }
    },

    custom_get_items_from_sales_invoice: function (frm, cdt, cdn) {
        if (frm.doc.company) {
            frappe.call({
                method: 'get_sales_invoice_list',
                args: { company: frm.doc.company },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;
                        open_dialogue(data, frm);
                    }
                }
            });
        }
    }
});

function open_dialogue(data, frm) {
    let currentFilteredData = data;
    let selectedRowNames = new Set(); // Track selected record names

    let fields = [
        {
            label: 'Invoice Name',
            fieldname: 'invoice_name_filter',
            fieldtype: 'Link',
            options: 'Sales Invoice',
            reqd: 0
        },
        {
            fieldtype: 'Column Break'
        },
        {
            label: 'Customer',
            fieldname: 'customer_filter',
            fieldtype: 'Link',
            options: 'Customer',
            reqd: 0
        },
        {
            fieldtype: 'Section Break'
        },
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
            label: 'Results'
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Sales Invoices',
        size: 'extra-large',
        fields: fields,
    });

    function renderTable(filteredData) {
        const tableHTML = `
            <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
                <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background-color: #f9f9f9;">
                            <th style="padding: 10px; width: 120px;">Name</th>
                            <th style="padding: 10px; width: 120px;">Cust Name</th>
                            <th style="padding: 10px; width: 120px;">Cust ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData.map((record, index) => `
                            <tr id="row-${index}" class="table-row" style="cursor: pointer; background-color: ${selectedRowNames.has(record.name) ? '#d9f9d9' : ''}">
                                <td style="padding: 10px;">${record.name || ''}</td>
                                <td style="padding: 10px;">${record.customer_name || ''}</td>
                                <td style="padding: 10px;">${record.customer || ''}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
        dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);
    }

    function attachRowEvents(filteredData) {
        dn_dialogue.$wrapper.find('.table-row').on('click', function () {
            let rowIndex = $(this).attr('id').split('-')[1];
            let record = filteredData[rowIndex];

            if (selectedRowNames.has(record.name)) {
                selectedRowNames.delete(record.name);
                $(this).css('background-color', '');
            } else {
                selectedRowNames.add(record.name);
                $(this).css('background-color', '#d9f9d9');
            }
        });
    }

    function renderFooter() {
        let customFooter = `
            <div class="custom-footer" style="display: flex; justify-content: flex-end; align-items: center; margin-top: 20px;">
                <button class="btn btn-dark ok-btn">OK</button>
            </div>
        `;
        dn_dialogue.fields_dict.rates.$wrapper.append(customFooter);

        dn_dialogue.$wrapper.find('.ok-btn').off('click').on('click', function () {
            if (selectedRowNames.size > 0) {
                let selectedData = data.filter(record => selectedRowNames.has(record.name));

                selectedData.forEach((record) => {
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
    }

    function applyFilter() {
        const invoiceFilter = dn_dialogue.get_value('invoice_name_filter');
        const customerFilter = dn_dialogue.get_value('customer_filter');

        currentFilteredData = data.filter(record => {
            const nameMatch = invoiceFilter ? record.name === invoiceFilter : true;
            const customerMatch = customerFilter ? record.customer === customerFilter : true;
            return nameMatch && customerMatch;
        });

        renderTable(currentFilteredData);
        renderFooter();
        attachRowEvents(currentFilteredData);
    }

    // Initial render
    renderTable(data);
    renderFooter();
    attachRowEvents(data);

    // Hook up filter onchange
    dn_dialogue.fields_dict.invoice_name_filter.df.onchange = applyFilter;
    dn_dialogue.fields_dict.customer_filter.df.onchange = applyFilter;

    dn_dialogue.show();
}


// function updateDeliveryStopRow(row, record) {
//     let name = record.name.startsWith('DN-') ? 'delivery_note' : 'custom_sales_invoice';
//     frappe.model.set_value(row.doctype, row.name, name, record.name || '');
//     frappe.model.set_value(row.doctype, row.name, 'custom_total_qty', record.total_qty || '');
//     frappe.model.set_value(row.doctype, row.name, 'customer', record.customer || '');

//     frappe.model.set_value(row.doctype, row.name, 'custom_invoice_shipping_address',
//         record.custom_invoice_shipping_address || record.shipping_address || '');

//     frappe.model.set_value(row.doctype, row.name, 'custom_sales_person_id', record.sales_contact || '');
//     frappe.model.set_value(row.doctype, row.name, 'custom_sales_contact_no', record.contact_no_1 || '');
// }


function updateDeliveryStopRow(row, record) {
    let name = record.name.startsWith('DN-') ? 'delivery_note' : 'custom_sales_invoice';
    frappe.model.set_value(row.doctype, row.name, name, record.name || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_total_qty', record.total_qty || '');
    frappe.model.set_value(row.doctype, row.name, 'customer', record.customer || '');
    frappe.model.set_value(row.doctype, row.name, 'contact', record.customer_name || '');

    if (record.custom_invoice_shipping_address) {
        frappe.model.set_value(row.doctype, row.name, 'custom_invoice_shipping_address', record.custom_invoice_shipping_address || '');
    } else {
        frappe.model.set_value(row.doctype, row.name, 'custom_invoice_shipping_address', record.shipping_address || '');
    }

    frappe.model.set_value(row.doctype, row.name, 'custom_document_date', record.posting_date || '');
    
    
    frappe.model.set_value(row.doctype, row.name, 'custom_sales_person_id', record.sales_contact || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_sales_contact_no', record.contact_no_1 || '');
    
}