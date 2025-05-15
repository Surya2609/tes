frappe.ui.form.on('Delivery Trip', {
    custom_total_boxes: function(frm, cdt, cdn) {
        calculate_total_boxes(frm);
    },   
});

function calculate_total_boxes(frm) {
    let total = 0;
    frm.doc.delivery_stops.forEach(function(row) {
        if(row.custom_box) total += parseInt(row.custom_box) || 0;
    });
    frm.set_value('total_custom_box', total); // total_custom_box is a field to store/display total
}