frappe.ui.form.on('Delivery Trip', {
    onload: function(frm) {    
        if (frm.is_new()) {
            apply_series_filter(frm);
       }    
    
    },
  
});

function apply_series_filter(frm) {
    if (frm.doc.company) {  // Ensure company is set
        if (frm.doc.company == "REVURU FASTENERS PVT LTD") {
            frm.set_value("naming_series", "DT-RF.YYYY.-");
        }
    }
}
