frappe.ui.form.on('Sales Order', {
    shipping_address: function(frm) {
        let address = frm.doc.shipping_address;
        console.log("address",address);
        frm.set_value('custom_temporary_shipping_address', address);
    }
});

