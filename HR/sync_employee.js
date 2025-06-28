frappe.ui.form.on('Employee', {
    refresh: function(frm) {
        frm.add_custom_button('Test Call', function () {
            frappe.call({
                method: 'get_all_employee_attendace',
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        frappe.msgprint(__('Received ' + r.message.length + ' active employees with images'));
                        console.log(r.message); // Full list in console
                    } else {
                        frappe.msgprint(__('No active employees found or no response'));
                    }
                }
            });
        });
    }
});
