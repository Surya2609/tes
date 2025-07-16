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
                        console.log("r data", r.message);
                        if (r.message) {
                            open_purchase_orders(r.message, frm);
                        }
                    }
                });
            } else {
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
        { fieldtype: 'Column Break' },
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
                            <th>Qty</th>
                            
                            <th>PO</th>
                            <th>ASN</th>
                            <th>POR</th>
                            <th>UOM</th>
                            
                            <th>Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((row) => {
            const key = getRowKey(row);
            const state = selectedRowState[key] || {};
            const isChecked = state.checked ? 'checked' : '';
            const qty = state.pending_qty !== undefined ? state.pending_qty : row.pending_qty;

            return `
                                <tr>
                                    <td><input type="checkbox" class="row-selector" data-key="${key}" ${isChecked}></td>
                                    <td>${row.name}</td>
                                    <td>${row.item_code}</td>
                                    <td>${row.item_name}</td>
                                     <td>${row.pending_qty}</td>
                                     
                                     <td>${row.po_qty}</td>
                                     <td>${row.transit_qty}</td>
                                     <td>${row.grn_qty}</td>
                                     <td>${row.uom}</td>
                                   
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

        dialog.$wrapper.find('.ok-btn').off('click').on('click', async function () {
            const selectedRows = [];

            data.forEach((row) => {
                const key = getRowKey(row);
                const state = selectedRowState[key];
                if (state?.checked) {
                    const qty = state.pending_qty !== undefined ? state.pending_qty : row.pending_qty;
                    if (qty > row.pending_qty) {
                        frappe.msgprint(`Qty for PO ${row.name} cannot exceed ${row.qty}`);
                        return;
                    }
                    selectedRows.push({ ...row, qty });
                }
            });

            if (selectedRows.length > 0) {
                console.log("selected rs", selectedRows);


                //  selectedRows.forEach((record) => {
                //      console.log("rec",record);
                //         let emptyRow = frm.doc.items.find(row => !row.item);
                //         if (emptyRow) {
                //          await   updateFieldsAsn(emptyRow, record);
                //         } else {
                //             let newRow = frm.add_child('items');
                //           await updateFieldsAsn(newRow, record);
                //         }
                //     });
                let price_list = selectedRows[0].buying_price_list;
                let currency = selectedRows[0].currency;

                let taxes_and_charges = selectedRows[0].taxes_and_charges;
                let tax_category = selectedRows[0].tax_category;
                let apply_discount_on = selectedRows[0].apply_discount_on;

                let additional_discount_percentage = selectedRows[0].additional_discount_percentage;
                let discount_amount = selectedRows[0].discount_amount;
                let disable_rounded_total = selectedRows[0].disable_rounded_total;
                
                ////  price 
                frm.set_value('buying_price_list', price_list);
                frm.set_value('currency', currency);

                //// taxes and templates
                 console.log("taxes_and_charges", taxes_and_charges);
                 console.log("tax_category", tax_category);
                 console.log("apply_discount_on", apply_discount_on);
                 console.log("additional_discount_percentage", additional_discount_percentage);
                 console.log("discount_amount", discount_amount);

                frm.set_value('purchase_taxes_and_charges_template', taxes_and_charges);
                frm.set_value('tax_category', tax_category);

                //// discounts
                frm.set_value('apply_additional_discount_on', apply_discount_on);
                frm.set_value('additional_discount_percentage', additional_discount_percentage);
                frm.set_value('additional_discount_amount', discount_amount);

                //// round total disable
                frm.set_value('disable_rounded_total', disable_rounded_total);


                for (const record of selectedRows) {
                    console.log("records",record);
                    let emptyRow = frm.doc.items.find(row => !row.item);
                    if (emptyRow) {
                        await updateFieldsAsn(emptyRow, record);
                    } else {
                        let newRow = frm.add_child('items');
                        await updateFieldsAsn(newRow, record);
                    }
                }

                frm.refresh_field('items');
                dialog.hide();
            } else {
                frappe.msgprint("Please select at least one row.");
            }
        });

        // dialog.$wrapper.find('.ok-btn').off('click').on('click', async function () {
        //     const selectedRows = [];

        //     data.forEach((row) => {
        //         const key = getRowKey(row);
        //         const state = selectedRowState[key];
        //         if (state?.checked) {
        //             const qty = state.qty !== undefined ? state.qty : row.qty;
        //             if (qty > row.qty) {
        //                 frappe.msgprint(`Qty for PO ${row.name} cannot exceed ${row.qty}`);
        //                 return;
        //             }
        //             selectedRows.push({ ...row, qty });
        //         }
        //     });

        //     if (selectedRows.length > 0) {
        //         console.log("selected rs", selectedRows);

        //         selectedRows.forEach((record) => {

        //             let emptyRow = frm.doc.items.find(row => !row.item_code);
        //             if (emptyRow) {
        //                 await updateFieldsAsn(emptyRow, record);
        //             } else {
        //                 let newRow = frm.add_child('items');
        //                 await updateFieldsAsn(newRow, record);
        //             }
        //         });
        //         frm.refresh_field('items');
        //         dialog.hide();
        //     } else {
        //         frappe.msgprint("Please select at least one row.");
        //     }
        // });
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

async function updateFieldsAsn(row, record) {
    console.log("gst", record.gst_treatment);
    await frappe.model.set_value(row.doctype, row.name, 'item', record.item_code || '');
    await frappe.model.set_value(row.doctype, row.name, 'item_name', record.item_name || '');
    await frappe.model.set_value(row.doctype, row.name, 'uom', record.uom || '');
    await frappe.model.set_value(row.doctype, row.name, 'qty', record.pending_qty || '');
    await frappe.model.set_value(row.doctype, row.name, 'rate', record.rate || '');

    await frappe.model.set_value(row.doctype, row.name, 'unit_rate', record.custom_unit_rate || '');
    await frappe.model.set_value(row.doctype, row.name, 'discount_percent', record.custom_discount_percent || '');
    await frappe.model.set_value(row.doctype, row.name, 'poi_name', record.poi_name || '');

    await frappe.model.set_value(row.doctype, row.name, 'po_no', record.name || '');

    await frappe.model.set_value(row.doctype, row.name, 'buying_price_list', record.buying_price_list || '');
    await frappe.model.set_value(row.doctype, row.name, 'currency', record.currency || '');

    //// tax details
    await frappe.model.set_value(row.doctype, row.name, 'item_tax_template', record.item_tax_template || '');
    await frappe.model.set_value(row.doctype, row.name, 'gst_treatment', record.gst_treatment || '');

}