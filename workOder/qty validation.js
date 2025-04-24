frappe.ui.form.on("Work Order", {
    refresh: function(frm) {
        if (frm.doc.bom_no) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "BOM",
                    name: frm.doc.bom_no
                },
                callback: function(r) {
                    if (r.message) {
                        let bom_qty = r.message.quantity;
                        if (frm.doc.qty > bom_qty) {
                            frappe.msgprint({
                                title: __("Validation Error"),
                                message: __("The Work Order quantity must match the BOM quantity: " + bom_qty),
                                indicator: "red"
                            });
                            frm.set_value('qty', bom_qty);
                        }
                    }
                }
            });
        }
    },
        
     refresh: function(frm) {
        if (frm.doc.bom_no) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "BOM",
                    name: frm.doc.bom_no
                },
                callback: function(r) {
                    if (r.message) {
                        let bom_qty = r.message.quantity;
                        if (frm.doc.qty > bom_qty) {
                            frappe.msgprint({
                                title: __("Validation Error"),
                                message: __("The Work Order quantity must match the BOM quantity: " + bom_qty),
                                indicator: "red"
                            });
                             frm.set_value('qty', bom_qty);
                            frappe.validated = false;
                        }
                    }
                }
            });
        }
    }
});