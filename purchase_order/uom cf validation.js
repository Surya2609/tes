frappe.ui.form.on('Purchase Order Item', {
    uom: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];

        frappe.call({
            method: 'get_item_cf_uoms', // should be a whitelisted server method
            args: {
                item: item.item_code                
            },
            callback: function (r) {
                if (r.message) {
                    let uoms = r.message; // assuming it's a list of { uom, conversion_factor }

                    let isValidUOM = uoms.some(row => row.uom === item.uom);

                    if (!isValidUOM) {
                        frappe.model.set_value(cdt, cdn, 'uom', '');
                        frappe.msgprint("Please set a valid UOM and conversion factor for this item.");
                    }
                }
            }
        });
    }
});