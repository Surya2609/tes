frappe.ui.form.on('Purchase Receipt', {
    refresh: function (frm) {
        frm.add_custom_button('Get Items', () => {
            if (frm.doc.supplier && frm.doc.company) {
                frappe.call({
                    method: 'get_asn_items',
                    args: {
                        company: frm.doc.company,
                        supplier: frm.doc.supplier
                    },
                    callback: function (r) {
                        console.log("r data", r.message);
                        if (r.message) {
                            open_asn_details(r.message, frm);
                        }
                    }
                });
            } else {
                frappe.msgprint("Please Select Company and Supplier");
            }
        });
    },
});

function open_asn_details(data, frm) {
    data.forEach(row => {
        row._uuid = generateUUID();
    });

    const selectedKeys = new Set(); // to track selected rows by UUID

    const fields = [
        { label: 'Purchase Order', fieldname: 'po_filter', fieldtype: 'Data' },
        { fieldtype: 'Column Break' },
        { label: 'Item Code', fieldname: 'item_filter', fieldtype: 'Data' },
        { fieldtype: 'Section Break' },
        { label: 'Invoice No', fieldname: 'invoice_filter', fieldtype: 'Data' },
        { fieldtype: 'Column Break' },
        { label: 'Arrival Date (yyyy-mm-dd)', fieldname: 'arrival_filter', fieldtype: 'Date' },
        { fieldtype: 'Section Break' },
        { fieldname: 'rates', fieldtype: 'HTML', label: 'Results' }
    ];

    const dialog = new frappe.ui.Dialog({
        title: 'ASN Details',
        fields: fields,
        size: 'large'
    });

    function renderTable(records) {
        const html = `
            <div style="overflow-x:auto; max-height:400px; border:1px solid #ddd; padding:10px;">
                <table class="table table-bordered" style="width:100%; font-size: 13px;" id="asn-table">
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>PO No</th>
                            <th>Item Code</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>UOM</th>
                            <th>Invoice No</th>
                            <th>Arrival Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((row) => {
            const isChecked = selectedKeys.has(row._uuid) ? 'checked' : '';
            return `
                                <tr>
                                    <td><input type="checkbox" class="row-check" data-key="${row._uuid}" ${isChecked}></td>
                                    <td>${row.po_no}</td>
                                    <td>${row.item}</td>
                                    <td>${row.qty}</td>
                                    <td>${row.rate}</td>
                                    <td>${row.amount}</td>
                                    <td>${row.uom}</td>
                                    <td>${row.supplier_invoice_no || ''}</td>
                                    <td>${row.estimated_arrival_date || ''}</td>
                                </tr>`;
        }).join('')}
                    </tbody>
                </table>
                <div style="text-align:right; margin-top: 10px;">
                    <button class="btn btn-primary" id="asn-ok-btn">OK</button>
                </div>
            </div>
        `;
        dialog.fields_dict.rates.$wrapper.html(html);

        dialog.fields_dict.rates.$wrapper.find('.row-check').on('change', function () {
            const key = $(this).attr('data-key');
            if ($(this).is(':checked')) {
                selectedKeys.add(key);
            } else {
                selectedKeys.delete(key);
            }
        });


        dialog.fields_dict.rates.$wrapper.find('#asn-ok-btn').on('click', async () => {
            const selectedRows = data.filter(row => selectedKeys.has(row._uuid));
            console.log("✅ Selected Rows:", selectedRows);

            if (!selectedRows.length) {
                frappe.msgprint("Please select at least one row.");
                return;
            }

            // Freeze screen with fallback
            if (frappe.ui && frappe.ui.freeze) {
                frappe.ui.freeze('Updating ASN...');
            } else if (frappe.freeze) {
                frappe.freeze('Updating ASN...');
            } else {
                // Manual loader for older Frappe versions
                window.__manual_loader_dialog__ = new frappe.ui.Dialog({
                    title: 'Please Wait',
                    indicator: 'blue',
                    fields: [{
                        fieldtype: 'HTML',
                        fieldname: 'loading_html',
                        options: `<div style="text-align:center;"><i class="fa fa-spinner fa-spin fa-2x"></i><br><br>Processing ASN rows...</div>`
                    }]
                });
                window.__manual_loader_dialog__.show();
            }

            let unlinkedItems = [];

            for (let i = 0; i < selectedRows.length; i++)  {
                try {
                    let result = await checkLinkedPr(selectedRows[i]);

                    if (!result.linked) {
                        unlinkedItems.push(result.item);
                    } else {
                        await updateAsnAndPr(selectedRows[i], result);
                    }

                } catch (e) {
                    console.error(`❌ Error updating row: ${selectedRows[i].id}`, e);
                    frappe.msgprint(`Error checking row: ${selectedRows[i].id}`);
                }
            }

            // Unfreeze screen
            if (frappe.ui && frappe.ui.unfreeze) {
                frappe.ui.unfreeze();
            } else if (frappe.unfreeze) {
                frappe.unfreeze();
            } else if (window.__manual_loader_dialog__) {
                window.__manual_loader_dialog__.hide();
            }

            if (unlinkedItems.length > 0) {
                frappe.msgprint({
                    title: 'Missing Purchase Receipt Linkage',
                    message: `The following items are not linked with any Purchase Receipt:<br><b>${unlinkedItems.join(', ')}</b>`,
                    indicator: 'orange'
                });
            }

            frappe.msgprint('✅ ASN rows updated.');
            dialog.hide();
            frm.reload_doc(); // Refresh only once after loop
        });

    }

    function applyFilters() {
        const po = dialog.get_value('po_filter')?.toLowerCase() || '';
        const item = dialog.get_value('item_filter')?.toLowerCase() || '';
        const invoice = dialog.get_value('invoice_filter')?.toLowerCase() || '';
        const arrival = dialog.get_value('arrival_filter')?.toLowerCase() || '';

        const filtered = data.filter(row =>
            (row.po_no || '').toLowerCase().includes(po) &&
            (row.item || '').toLowerCase().includes(item) &&
            (row.supplier_invoice_no || '').toLowerCase().includes(invoice) &&
            (row.estimated_arrival_date || '').toLowerCase().includes(arrival)
        );

        renderTable(filtered);
    }

    renderTable(data);
    dialog.show();

    ['po_filter', 'item_filter', 'invoice_filter'].forEach(field => {
        dialog.fields_dict[field].$wrapper.find('input').on('input', applyFilters);
    });

    dialog.fields_dict['arrival_filter'].$wrapper.find('input').on('change', applyFilters);
}

async function checkLinkedPr(selectedData) {
    if (!selectedData.po_no) {
        return { linked: false, item: selectedData.item };
    }

    const result = await frappe.db.get_list('Purchase Receipt Item', {
        filters: {
            purchase_order: selectedData.po_no,
            item_code: selectedData.item,
            rate: selectedData.rate
        },
        fields: ['item_code', 'parent'],
        limit: 1
    });

    if (result.length > 0) {
        return { linked: true, parent: result[0].parent };
    } else {
        return { linked: false, item: selectedData.item };
    }
}


async function updateAsnAndPr(selectedData, result) {
    console.log("🔁 Updating:", selectedData.name, "→", result.parent);

    // Set 'custom_asntransit' silently (no UI refresh or validation trigger)
    await frappe.db.set_value('Purchase Receipt', result.parent, 'custom_asntransit', selectedData.name);

    // Update both 'done' and 'purchase_receipt' fields in one call
    await frappe.call({
        method: 'frappe.client.set_value',
        args: {
            doctype: 'Advance Shipment Child',
            name: selectedData.id,
            fieldname: {
                done: 1,
                purchase_receipt: result.parent
            }
        }
    });
}


function generateUUID() {
    return Math.random().toString(36).substr(2, 10);
}