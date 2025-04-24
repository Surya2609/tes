frappe.ui.form.on('Service DC OUT Items', {
    item: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!frm.doc.supplier) {
            frappe.msgprint(__('Selected Supplier First!'));
        }

        if(frm.doc.supplier && row.item) {
            frappe.call({
                method: 'get_supplier_default_dc_warehouse',
                args: {
                    supplier: frm.doc.supplier
                },
                callback: function (r) {
                    if (r.message && r.message.length > 0) {
                        console.log(r.message);
                        row.target_warehouse = r.message[0].custom_default_dc_warehouse;
                        frm.refresh_field('items');
                    }else{
                        row.target_warehouse = "";
                        frm.refresh_field('items');
                    }
                }
            });
        }      
    },

    source_warehouse: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item && row.source_warehouse) {
            frappe.call({
                method: 'get_product_details',
                args: {
                    item_code: row.item
                },
                callback: function (r) {
                    if (r.message && r.message.length > 0) {
                        console.log(r.message);
                        let selectedWarehouse = r.message.find(w => w.warehouse === row.source_warehouse);
                        if (selectedWarehouse) {
                            row.qty = selectedWarehouse.stock_in_warehouse;
                            row.uom = selectedWarehouse.stock_uom;
                            frm.refresh_field('items');                         
                        } else {
                            frappe.msgprint(__('Selected warehouse does not have stock data.'));
                        }
                    }
                }
            });
        } else {
            frappe.msgprint(__('Select Item First'));
        }
    }
});