frappe.ui.form.on('Sales Order Item', {
    qty: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        console.log("i c",item.conversion_factor);
        if(item.conversion_factor && item.stock_uom == "Kg" && item.uom == "Nos") {
            let qtyPick = item.qty;
                console.log("invi");
                let c_f = parseFloat(item.conversion_factor);
                let qty = parseFloat(item.qty);
                qtyPick = qty/c_f;
                frappe.model.set_value(cdt, cdn, 'stock_qty', qtyPick);           
        }
    }
});
