frappe.ui.form.on('Service DC OUT', {
    refresh: function (frm) {
        let company = frappe.defaults.get_user_default("Company");
        console.log("User's Company:", company);
        
    }
});