frappe.ui.form.on('Sales Invoice Item', {
    item_code: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if (frm.doc.customer && item.item_code) {
            frappe.call({
                method: 'get_customer_part',
                args: {
                    item_code: item.item_code,
                    customer: frm.doc.customer
                },
                callback: function (r) {
                    if (r.message) {
                        console.log("msg", r.message);
                        let data = r.message;  // Assign response to 'data'
         
                        if (data[0].ref_code != null) {
                            frappe.model.set_value(item.doctype, item.name, 'custom_customer_part', data[0].ref_code);
                        }
                    }
                }
            });
        }
    }
});