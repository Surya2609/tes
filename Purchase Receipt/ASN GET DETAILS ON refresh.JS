frappe.ui.form.on('Purchase Receipt', {
    refresh(frm) {
        console.log("items", frm.doc.items);
        console.log("lenght", frm.doc.items.length);

        if ((frm.doc.items || []).some(item => !!item.item_code)) {
            frm.trigger("fetch_asn_data_for_items");
        }        
    },

    fetch_asn_data_for_items: function (frm) {
        (frm.doc.items || []).forEach(row => {
            if (row.item_code && row.purchase_order && frm.doc.supplier && frm.doc.supplier_delivery_note && frm.doc.company) {
                frappe.call({
                    method: 'get_asn_qty',
                    args: {
                        purchase_order: row.purchase_order,
                        item_code: row.item_code,
                        company: frm.doc.company,
                        supplier_inv: frm.doc.supplier_delivery_note,
                        supplier: frm.doc.supplier
                    },
                    callback: function (r) {
                        if (r.message && r.message.length > 0) {
                            let asnQty = r.message[0].qty;
                            let asnId = r.message[0].name;

                            frappe.model.set_value(row.doctype, row.name, 'asn_qty', asnQty);
                            frappe.model.set_value(row.doctype, row.name, 'qty', asnQty);
                            frappe.model.set_value(row.doctype, row.name, 'asn_id', asnId);
                        }else {
                            frappe.model.set_value(row.doctype, row.name, 'asn_qty', 0);
                            frappe.model.set_value(row.doctype, row.name, 'asn_id', "");
                        }
                    }
                });
            }
        });
    }
});