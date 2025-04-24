frappe.ui.form.on('Calibration', {
    onload: function (frm) {
        if (!frm.doc.calibration_date) {
            frappe.model.set_value(frm.doctype, frm.docname, 'calibration_date', frappe.datetime.get_today());
        }
    },
    refresh: function (frm) {
        calculate_remaining_days(frm);
    },
    calibration_date: function (frm) {
        calculate_remaining_days(frm);
    },
    calibration_due_date: function (frm) {
        calculate_remaining_days(frm);
    }
});

function calculate_remaining_days(frm) {
    if (frm.doc.calibration_due_date) {
        let currentDate = frappe.datetime.now_date();
        let dueDate = frappe.datetime.str_to_obj(frm.doc.calibration_due_date);
        let today = frappe.datetime.str_to_obj(currentDate);
        let timeDiff = dueDate - today;
        let remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
        if (remainingDays >= 0) {
            frappe.model.set_value(frm.doctype, frm.docname, 'remaining_days', remainingDays);
        } else {
            frappe.model.set_value(frm.doctype, frm.docname, 'remaining_days', 'Overdue');
        }
    } else {
        frappe.model.set_value(frm.doctype, frm.docname, 'remaining_days', '');
    }
}