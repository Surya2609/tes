frappe.ui.form.on("Purchase Invoice", {
    refresh: function(frm) {
        // Check if there are items in the table
        if (frm.doc.items && frm.doc.items.length > 0) {
            let purchase_receipt = frm.doc.items[0].purchase_receipt; // Fetch the first item's Purchase Receipt
            
            if (purchase_receipt) {
                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Purchase Receipt",
                        name: purchase_receipt
                    },
                    callback: function(r) {
                        if (r.message) {
                            frm.set_value("bill_no", r.message.supplier_delivery_note); // Fetch Supplier Invoice No
                            frm.set_value("bill_date", r.message.custom_supplier_delivery_date); // Fetch Supplier Invoice Date
                        }
                    }
                });
            }
        }
    }
});
