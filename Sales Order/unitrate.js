frappe.ui.form.on('Sales Order', {
    refresh(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button("Update Rate", function () {
                frm.doc.items.forEach(function (row) {

                    let discountRate = parseFloat(row.rate || 0);
                    let discountPercent = parseFloat(row.custom_discount_percent || 0);
                    let originalRate = 0;

                    let discountAmount = 1 - discountPercent / 100;
                    originalRate = discountRate / discountAmount;

                    console.log("working", originalRate);
                    row.custom_unit_rate = originalRate;
                });
                frm.refresh_field("items");
                frappe.msgprint("Unit Rate updated based on Rate.");
            });
        }
    },
});