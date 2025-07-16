frappe.ui.form.on('Purchase Order', {
    currency: function (frm) {
        if (frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            if (frm.doc.currency && frm.doc.buying_price_list) {
                if (frm.doc.currency == "USD") {
                    frm.set_value("buying_price_list", "MVDF FASTENERS BUYING (USD)");
                } else if (frm.doc.currency == "INR") {
                    frm.set_value("buying_price_list", "MVDF FASTENERS BUYING");
                }
            }
        }
    }
});

frappe.ui.form.on('Sales Order', {
    currency: function (frm) {
        if (frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            if (frm.doc.currency && frm.doc.selling_price_list) {
                if (frm.doc.currency == "USD") {
                    frm.set_value("buying_price_list", "MVDF FASTENERS SELLING (USD)");
                } else if (frm.doc.currency == "INR") {
                    frm.set_value("buying_price_list", "MVDF FASTENERS SELLING");
                }
            }
        }
    }
});