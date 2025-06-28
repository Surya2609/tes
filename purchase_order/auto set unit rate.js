frappe.ui.form.on("Purchase Order", {
    refresh: function (frm) {
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button("Update Unit Rates", function () {
                frm.doc.items.forEach((item_row) => {
                    console.log("dis", item_row.custom_discount_percent);
                    if (item_row.custom_discount_percent == 0) {
                        frappe.model.set_value(
                            "Purchase Order Item",
                            item_row.name,
                            "custom_unit_rate",
                            item_row.rate
                        );
                    }
                });
                frappe.msgprint("Rates updated for all items which are not given discount.");
                frm.refresh_field("items");
            });
        }
    }
});