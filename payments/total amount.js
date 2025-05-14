frappe.ui.form.on('Payment Entry', {
    custom_get_total: function (frm) {

        
        let total_outstanding = 0;
        (frm.doc.references || []).forEach(row => {
            console.log("line", row.outstanding_amount);
            total_outstanding += flt(row.outstanding_amount);
        });

        frm.set_value("custom_total_amount", total_outstanding);

    },
});



frappe.ui.form.on('Payment Entry', {
    refresh(frm) {
        if (frm.fields_dict.references && frm.fields_dict.references.grid) {
            frm.fields_dict.references.grid.refresh = function() {
                frappe.ui.form.Grid.prototype.refresh.call(this); // Call original
                calculate_total_outstanding(frm); // Your custom function
            };
        }
    }
});

function calculate_total_outstanding(frm) {
    let total_outstanding = 0;
    (frm.doc.references || []).forEach(row => {
        console.log("line", row.outstanding_amount);
        total_outstanding += flt(row.outstanding_amount);
    });

    frm.set_value("custom_total_amount", total_outstanding);
}


   // if (frm.is_new()) {

    //    }    