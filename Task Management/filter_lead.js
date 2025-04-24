frappe.ui.form.on('Task', {
    onload: function (frm) {
        set_lead_filter_user_based(frm);  // Apply the filter when the form loads
    },
});

function set_lead_filter_user_based(frm) {
    frm.set_query("custom_lead", function () {
        return {
            filters: {
                owner: frappe.session.user // Show only leads created by the logged-in user
            }
        };
    });
}