frappe.ui.form.on('Quality Inspection Reading', {
    specification: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'specification', frm.doc.item_code);
    }
});