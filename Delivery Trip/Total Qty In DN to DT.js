frappe.ui.form.on('Delivery Trip', {
    refresh: function(frm) {
        if (frm.doc.delivery_stops && frm.doc.delivery_stops.length > 0) {
            frm.doc.delivery_stops.forEach(function(row) {
                console.log("times");
                if (row.delivery_note) {
                    frappe.call({
                        method: 'get_dn_qtyt',
                        args: {
                            delivery_note: row.delivery_note
                        },
                        callback: function(r) {
                            if (r.message) {
                                let total_qty = r.message[0].total_qty;
                                frappe.model.set_value("Delivery Stop", row.name, 'custom_total_qty', total_qty);
                            }
                        }
                    });
                }
            });
        }
    }
});
