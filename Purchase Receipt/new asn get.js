frappe.ui.form.on('Purchase Receipt', {
    refresh: function (frm) {
        frm.add_custom_button('From ASN', () => {
            if (frm.doc.supplier && frm.doc.company) {
                console.log("sinv", frm.doc.supplier_delivery_note);
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
        row._uuid = generateUUIDforAsn();
    });

    const selectedKeys = new Set(); // to track selected rows by UUID

    const fields = [
        { label: 'ASN', fieldname: 'asn_filter', fieldtype: 'Data' }, // ✅ New field       
        { fieldtype: 'Column Break' },
        { label: 'Item Code', fieldname: 'item_filter', fieldtype: 'Data' },
        { fieldtype: 'Column Break' },
        { label: 'Purchase Order', fieldname: 'po_filter', fieldtype: 'Data' },

        { fieldtype: 'Section Break' },

        { label: 'Invoice No', fieldname: 'invoice_filter', fieldtype: 'Data' },
        { fieldtype: 'Column Break' },
        { label: 'Arrival Date (yyyy-mm-dd)', fieldname: 'arrival_filter', fieldtype: 'Date' },
        { fieldtype: 'Column Break' },
        { fieldtype: 'Section Break' },
        { fieldname: 'rates', fieldtype: 'HTML', label: 'Results' },


    ];

    const dialog = new frappe.ui.Dialog({
        title: 'ASN Details',
        fields: fields,
        size: 'large'
    });

    function renderTable(records) {
        const selectedASN = [...selectedKeys]
            .map(key => data.find(row => row._uuid === key))
            .filter(row => row)
            .map(row => row.name)[0] || 'None';


        const html = `
            <div style="padding: 10px 0;">
                <div style="font-weight: bold; font-size: 14px;">
                    ✅ Selected ASN: <span style="color: green;">${selectedASN}</span>
                </div>
            </div>

            <div id="asn-table-wrapper" style="overflow-x:auto; max-height:600px; border:1px solid #ddd; padding:0;">
                <table class="table table-bordered" style="min-width: 1200px; width: 100%; font-size: 13px;" id="asn-table">
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>ASN</th>
                            <th>PO No</th>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Unit Rate</th>
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
                                <tr style="${isChecked ? 'background-color: #e6f7ff;' : ''}">
                                    <td><input type="checkbox" class="row-check" data-key="${row._uuid}" ${isChecked}></td>
                                    <td>${row.name}</td>
                                    <td>${row.po_no}</td>
                                    <td>${row.item}</td>
                                    <td>${row.item_name}</td>
                                    <td>${row.qty}</td>
                                    <td>${row.unit_rate}</td>
                                    <td>${row.amount}</td>
                                    <td>${row.uom}</td>
                                    <td>${row.supplier_invoice_no || ''}</td>
                                    <td>${row.estimated_arrival_date || ''}</td>
                                </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="text-align:right; margin-top: 15px;">
                <button class="btn btn-primary" id="asn-ok-btn">OK</button>
            </div>
        `;

        dialog.fields_dict.rates.$wrapper.html(html);

        // re-bind checkboxes
        dialog.fields_dict.rates.$wrapper.find('.row-check').on('change', function () {
            const key = $(this).attr('data-key');
            const selectedRow = data.find(row => row._uuid === key);

            if (!selectedRow) return;

            const selectedAsn = selectedRow.name;

            selectedKeys.clear();

            data.forEach(row => {
                if (row.name === selectedAsn) {
                    selectedKeys.add(row._uuid);
                }
            });

            renderTable(data);  // refresh UI with new ASN
        });

        dialog.fields_dict.rates.$wrapper.find('#asn-ok-btn').on('click', async () => {
            console.log("ASN Record Example:", data[0]);
            const selectedRows = data.filter(row => selectedKeys.has(row._uuid));
            console.log("✅ Selected Rows:", selectedRows);


            if (!selectedRows.length) {
                frappe.msgprint("Please select at least one row.");
                return;
            }

            if (selectedRows.length > 0) {
                console.log("selected rs", selectedRows);

                let first = selectedRows[0];
                if (first) {
                    await frm.set_value("custom_supplier_invoice_date", first.supplier_invoice_date || '');
                    await frm.set_value("supplier_delivery_note", first.supplier_invoice_no || '');
                    await frm.set_value("buying_price_list", first.buying_price_list || '');
                    await frm.set_value("custom_asn", first.name || '');
                    await frm.set_value("currency", first.currency || '');
                    await frm.set_value("custom_from_asn", 1);
                    await frm.set_value("custom_asn_total_qty", first.total_qty || 0);
                    await frm.set_value("custom_asn_total_amount", first.total_amount || 0);

                    await frm.set_value("tax_category", first.tax_category );
                    await frm.set_value("taxes_and_charges", first.purchase_taxes_and_charges_template);

                    await frm.set_value("apply_discount_on", first.apply_additional_discount_on || 0);

                    await frm.set_value("discount_amount", first.additional_discount_amount || 0);
                    await frm.set_value("additional_discount_percentage", first.additional_discount_percentage || 0);
                    
                    await frm.set_value("disable_rounded_total", first.disable_rounded_total || 0);
                }

                selectedRows.forEach((record) => {
                    console.log("un rate",record.unit_rate);
                    console.log("rec",record);

                    frm.add_child('items', {
                        item_code: record.item || '',
                        item_name: record.item_name || '',
                        purchase_order: record.po_no || '',
                        purchase_order_item: record.poi_name || '',
                        qty: record.qty || 0,
                        uom: record.uom || '',
                        custom_unit_rate: record.unit_rate || 0,
                        rate: record.rate || 0,
                        custom_discount_percent: record.discount_percent || 0,
                        asn_qty: record.qty || 0,
                        asn_id: record.name || ''
                    });
                });

                // Re-enable batch dialog
                frappe.flags.no_batch_dialog = false;              

                console.log("ffno batch", frappe.flags.no_batch_dialog);

                frm.refresh_field('items');

                // if (frm.doc.custom_from_asn) {
                //     frm.get_field('items').grid.cannot_add_rows = true;

                //     // frm.get_field('items').grid.wrapper.find('.grid-remove-rows').hide();

                //     frm.fields_dict["items"].grid.cannot_delete_rows = true;
                //     // frm.fields_dict["items"].grid.allow_add_rows = false;
                // }

                dialog.hide();
            } else {
                frappe.msgprint("Please select at least one row.");
            }

            // dialog.hide();
            frm.reload_doc(); // Refresh only once after loop
        });

    }


    // async function updateFieldsPor(row, record, frm) {
    //     console.log("record count test", record);

    //     // Ensure batch dialog is suppressed *inside* the function
    //     frappe.flags.no_batch_dialog = true;

    //     await frappe.model.set_value(row.doctype, row.name, 'item_code', record.item || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'purchase_order', record.po_no || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'purchase_order_item', record.poi_name || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'qty', record.qty || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'uom', record.uom || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', record.unit_rate || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'custom_discount_percent', record.discount_percent || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'custom_asn_qty', record.qty || '');
    //     await frappe.model.set_value(row.doctype, row.name, 'custom_asn_id', record.name || '');

    //     frappe.flags.no_batch_dialog = false; // Reset flag

    //     // Set parent fields
    //     await frm.set_value("custom_supplier_invoice_date", record.supplier_invoice_date || '');
    //     await frm.set_value("supplier_delivery_note", record.supplier_invoice_no || '');
    //     await frm.set_value("buying_price_list", record.buying_price_list || '');
    //     await frm.set_value("custom_asn", record.name || '');
    //     await frm.set_value("currency", record.currency || '');
    //     await frm.set_value("custom_from_asn", 1);
    //     await frm.set_value("custom_asn_total_qty", record.total_qty || 0);
    //     await frm.set_value("custom_asn_total_amount", record.total_amount || 0);
    // }

    function applyFilters() {
        const asn = dialog.get_value('asn_filter')?.toLowerCase() || '';
        const po = dialog.get_value('po_filter')?.toLowerCase() || '';
        const item = dialog.get_value('item_filter')?.toLowerCase() || '';
        const invoice = dialog.get_value('invoice_filter')?.toLowerCase() || '';
        const arrival = dialog.get_value('arrival_filter')?.toLowerCase() || '';

        const filtered = data.filter(row =>
            (row.name || '').toLowerCase().includes(asn) &&
            (row.po_no || '').toLowerCase().includes(po) &&
            (row.item || '').toLowerCase().includes(item) &&
            (row.supplier_invoice_no || '').toLowerCase().includes(invoice) &&
            (row.estimated_arrival_date || '').toLowerCase().includes(arrival)
        );

        renderTable(filtered);
    }

    renderTable(data);
    dialog.show();

    ['asn_filter', 'po_filter', 'item_filter', 'invoice_filter'].forEach(field => {
        dialog.fields_dict[field].$wrapper.find('input').on('input', applyFilters);
    });

    dialog.fields_dict['arrival_filter'].$wrapper.find('input').on('change', applyFilters);
}

function generateUUIDforAsn() {
    return Math.random().toString(36).substr(2, 10);
}


