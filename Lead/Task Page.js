frappe.ui.form.on('Lead', {
    refresh: function (frm) {
        add_task_btn(frm);
    },
});

function add_task_btn(frm) {
    if (!frm.is_new()) { // Show button only after saving
        frm.add_custom_button('Create Task', function() {
            frappe.new_doc('Task', { // Open new Task form
                custom_task_type : "For Customer",
                custom_lead: frm.doc.name // Prefill the Lead field with current Lead
            });
        }).addClass('btn-primary'); // Optional: Style the button
    }
}