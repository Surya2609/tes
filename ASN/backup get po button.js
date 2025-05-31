frappe.ui.form.on('Advance Shipment Notice', {
    refresh: function (frm) {
        frm.add_custom_button('Get Items', () => {
            if (frm.doc.supplier && frm.doc.company) {
                frappe.call({
                    method: 'get_po_items_detalils',
                    args: {
                        company: frm.doc.company,
                        supplier: frm.doc.supplier
                    },
                    callback: function (r) {
                        if (r.message) {
                            open_purchase_orders(r.message, frm);
                        }
                    }
                });
            }else {
                 frappe.msgprint("Please Select Company and Supplier");
            }
        });
    },
});

function open_purchase_orders(data, frm) {
    let selectedRowState = {}; // Track selection & qty by unique key

    function getRowKey(record) {
        return `${record.name}__${record.item_code}`;
    }

    const fields = [
        {
            label: 'Purchase Order',
            fieldname: 'invoice_name_filter',
            fieldtype: 'Link',
            options: 'Purchase Order',
        },
        {
            label: 'Item Code',
            fieldname: 'item_code_filter',
            fieldtype: 'Link',
            options: 'Item',
        },
        { fieldtype: 'Section Break' },
        {
            fieldname: 'rates',
            fieldtype: 'HTML',
            label: 'Results',
        }
    ];

    const dialog = new frappe.ui.Dialog({
        title: 'Purchase Orders',
        size: 'extra-large',
        fields: fields,
    });

    function renderTable(records) {
        const html = `
            <div style="overflow-x:auto; max-height:400px; border:1px solid #ddd; padding:10px;">
                <table class="table table-bordered" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>PO Name</th>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Qty (Editable)</th>
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((row) => {
                            const key = getRowKey(row);
                            const state = selectedRowState[key] || {};
                            const isChecked = state.checked ? 'checked' : '';
                            const qty = state.qty !== undefined ? state.qty : row.qty;

                            return `
                                <tr>
                                    <td><input type="checkbox" class="row-selector" data-key="${key}" ${isChecked}></td>
                                    <td>${row.name}</td>
                                    <td>${row.item_code}</td>
                                    <td>${row.item_name}</td>
                                    <td>
                                        <input type="number" class="editable-qty" data-key="${key}" max="${row.qty}" value="${qty}" style="width: 80px;">
                                    </td>
                                    <td>${row.rate}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        dialog.fields_dict.rates.$wrapper.html(html);

        // Event bindings
        dialog.$wrapper.find('.row-selector').on('change', function () {
            const key = $(this).data('key');
            selectedRowState[key] = selectedRowState[key] || {};
            selectedRowState[key].checked = $(this).is(':checked');
        });

        dialog.$wrapper.find('.editable-qty').on('input', function () {
            const key = $(this).data('key');
            const qty = parseFloat($(this).val());
            selectedRowState[key] = selectedRowState[key] || {};
            selectedRowState[key].qty = qty;
        });
    }

    function renderFooter() {
        const footer = `
            <div style="text-align:right; margin-top:20px;">
                <button class="btn btn-primary ok-btn">OK</button>
            </div>
        `;
        dialog.fields_dict.rates.$wrapper.append(footer);

        dialog.$wrapper.find('.ok-btn').off('click').on('click', function () {
            const selectedRows = [];

            data.forEach((row) => {
                const key = getRowKey(row);
                const state = selectedRowState[key];
                if (state?.checked) {
                    const qty = state.qty !== undefined ? state.qty : row.qty;
                    if (qty > row.qty) {
                        frappe.msgprint(`Qty for PO ${row.name} cannot exceed ${row.qty}`);
                        return;
                    }
                    selectedRows.push({ ...row, qty });
                }
            });

            if (selectedRows.length > 0) {
                uniqueItems(frm, selectedRows);
                dialog.hide();
            } else {
                frappe.msgprint("Please select at least one row.");
            }
        });
    }

    function applyFilters() {
        const poFilter = dialog.fields_dict.invoice_name_filter.$wrapper.find('input').val()?.toLowerCase() || '';
        const itemFilter = dialog.fields_dict.item_code_filter.$wrapper.find('input').val()?.toLowerCase() || '';

        const filtered = data.filter((row) =>
            row.name.toLowerCase().includes(poFilter) &&
            row.item_code.toLowerCase().includes(itemFilter)
        );

        renderTable(filtered);
        renderFooter();
    }

    // Initial render
    renderTable(data);
    renderFooter();
    dialog.show();
       setTimeout(() => {
        document.activeElement.blur();
    }, 100);

    // Attach filter input handlers
    dialog.fields_dict.invoice_name_filter.$wrapper.find('input').on('input', applyFilters);
    dialog.fields_dict.item_code_filter.$wrapper.find('input').on('input', applyFilters);
}


function uniqueItems(frm, selected) {
    let unique_items = {};

    selected.forEach(item => {
        const key = item.item_code;
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = qty * rate;

        if (unique_items[key]) {
            unique_items[key].qty += qty;
            unique_items[key].amount += amount;
            if (!unique_items[key].warehouses.includes(item.warehouse)) {
                unique_items[key].warehouses.push(item.warehouse);
            }
            if (!unique_items[key].po_names.includes(item.name)) {
                unique_items[key].po_names.push(item.name);
            }
        } else {
            unique_items[key] = {
                item_name: item.item_name,
                uom: item.uom,
                hsn_code: item.gst_hsn_code,
                qty: qty,
                item_code: item.item_code,
                rate: rate,
                amount: amount,
                warehouses: [item.warehouse],
                po_names: [item.name],
                schedule_dates: [item.schedule_date]
            };
        }
    });

    const mergedList = Object.values(unique_items).map(item => ({
        ...item,
        warehouses: item.warehouses.join(', '),
        po_names: item.po_names.join(', '),
        schedule_dates: item.schedule_dates.join(', ')
    }));

    mergedList.forEach((record) => {
        let emptyRow = frm.doc.items.find(row => !row.item);
        if (emptyRow) {
            updateFieldsAsn(emptyRow, record);
        } else {
            let newRow = frm.add_child('items');
            updateFieldsAsn(newRow, record);
        }
    });
    frm.refresh_field('items');
}

function updateFieldsAsn(row, record) {
    frappe.model.set_value(row.doctype, row.name, 'item', record.item_code || '');
    frappe.model.set_value(row.doctype, row.name, 'uom', record.uom || '');
    frappe.model.set_value(row.doctype, row.name, 'qty', record.qty || '');
    frappe.model.set_value(row.doctype, row.name, 'rate', record.rate || '');
    frappe.model.set_value(row.doctype, row.name, 'amount', record.amount || '');
    frappe.model.set_value(row.doctype, row.name, 'po_no', record.po_names || '');
}