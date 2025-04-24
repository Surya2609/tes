frappe.ui.form.on('Sales Order', {
    refresh: function (frm) {
        if (!frm.custom_buttons_added) {
            frm.custom_buttons_added = true;

            frm.fields_dict["items"].grid.add_custom_button(__('Add Item'), function () {
                let d = new frappe.ui.Dialog({
                    title: 'Add Item',
                    fields: [
                        { fieldtype: 'Section Break' },

                        // Row 1 - Item Code | Item Name | Custom Customer Part Code | Custom Customer Description
                        {
                            label: 'Item Code',
                            fieldname: 'item_code',
                            fieldtype: 'Link',
                            options: 'Item',
                            reqd: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'Item Name',
                            fieldname: 'item_name',
                            fieldtype: 'Data',
                            read_only: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'Customer Part Code',
                            fieldname: 'custom_customer_part_code',
                            fieldtype: 'Link',
                            options: 'Customer Part Mapping',
                            reqd: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'Customer Description',
                            fieldname: 'custom_customer_description',
                            fieldtype: 'Data'
                        },

                        { fieldtype: 'Section Break' },

                        // Row 2 - Qty | Rate | Amount | UOM
                        {
                            label: 'Qty',
                            fieldname: 'qty',
                            fieldtype: 'Float',
                            reqd: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'Rate',
                            fieldname: 'rate',
                            fieldtype: 'Currency',
                            reqd: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'Amount',
                            fieldname: 'amount',
                            fieldtype: 'Currency',
                            read_only: 1
                        },
                        { fieldtype: 'Column Break' },
                        {
                            label: 'UOM',
                            fieldname: 'uom',
                            fieldtype: 'Link',
                            options: 'UOM'
                        }
                    ],
                    primary_action_label: 'Add to Order',
                    primary_action(values) {
                        if (values.item_code && values.qty && values.rate) {
                            let row = frm.add_child('items', {
                                item_code: values.item_code,
                                item_name: values.item_name,
                                custom_customer_part_code: values.custom_customer_part_code,
                                custom_customer_description: values.custom_customer_description,
                                qty: values.qty,
                                rate: values.rate,
                                amount: values.qty * values.rate,
                                uom: values.uom
                            });
                            frm.refresh_field('items');
                            d.hide();
                        }
                    }
                });

                d.show();

                // After dialog is rendered
                setTimeout(() => {
                    // Auto-fill Item Name and Customer Part Code Description
                    d.fields_dict.item_code.$wrapper.find('input').on('blur', function () {
                        let item_code = d.get_value('item_code');
                        mapDetails(frm, d, item_code, null);  // Pass 'd' (dialog instance) here
                    });

                    // Auto-fill Customer Part Code on blur
                    d.fields_dict.custom_customer_part_code.$wrapper.find('input').on('blur', function () {
                        let part_code = d.get_value('custom_customer_part_code');
                        mapDetails(frm, d, null, part_code);  // Pass 'd' (dialog instance) here
                    });

                    // Auto-calculate Amount on qty or rate blur
                    const update_amount = () => {
                        let qty = d.get_value('qty') || 0;
                        let rate = d.get_value('rate') || 0;
                        d.set_value('amount', qty * rate);
                    };

                    d.fields_dict.qty.$wrapper.find('input').on('blur', update_amount);
                    d.fields_dict.rate.$wrapper.find('input').on('blur', update_amount);
                }, 300);
            });
        }
    }
});
function mapDetails(frm, d, item_code, customerCode) {
    if (item_code != null) {
        frappe.call({
            method: 'get_customer_part',  // Replace with the correct path to your method
            args: {
                item_code: item_code,
                customer: frm.doc.customer
            },
            callback: function (r) {
                if (r.message) {
                    let data = r.message;
                    console.log("data", data);
                    if (data.length != 0 && data[0].customer_part_code != null) {
                        // Set Customer Part Code and Description
                        d.set_value('custom_customer_part_code', data[0].customer_part_code);
                        d.set_value('custom_customer_description', data[0].customer_description);
                        d.set_value('item_name', data[0].item_name);

                        if (item_code) {
                            setDefaultUom(d, item_code);  // Call here after data is defined
                        }
                    } else {

                        setItemName(d, item_code);                  
                        d.set_value('custom_customer_part_code', null);
                        d.set_value('custom_customer_description', null);
                        d.set_value('item_name', null);
                        d.set_value('uom', '');
                    }
                }
            }
        });
    } else if (customerCode != null) {
        frappe.call({
            method: 'get_customer_part',
            args: {
                customer_part_code: customerCode,
                customer: frm.doc.customer
            },
            callback: function (r) {
                console.log("r me", r.message);
                if (r.message) {
                    let data = r.message;
                    console.log("data", data);
                    if (data.length != 0 && data[0].item != null) {
                        // Set Item Code based on Customer Part Code
                        d.set_value('item_code', data[0].item);
                        d.set_value('item_name', data[0].item_name);
                        d.set_value('custom_customer_description', data[0].customer_description);

                        setDefaultUom(d, data[0].item);  // Safe to call here
                    } else {
                        d.set_value('item_code', null);
                        d.set_value('item_name', null);
                        d.set_value('custom_customer_description', null);
                        d.set_value('uom', '');
                    }
                }
            }
        });
    }
}

function setItemName(d, item_code) {
    console.log("ic", item_code);
    frappe.db.get_value('Item', item_code, 'item_name', function(r) {
        console.log(r.message);
        if (r && r.message && r.message.item_name) {
            d.set_value('item_name', r.message.item_name);
        } else {
            d.set_value('item_name', '');
        }
    });
}


function setDefaultUom(d, item_code) {
    console.log("ic", item_code);
        frappe.db.get_value('Item', item_code, 'stock_uom', function(r) {
            console.log(r.message);
            if (r && r.message && r.message.stock_uom) {
                d.set_value('uom', r.message.stock_uom);
            } else {
                d.set_value('uom', '');
            }
        });
}

