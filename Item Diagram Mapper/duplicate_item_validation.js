frappe.ui.form.on('Selected Items Table', {
    item_code: function (frm, cdt, cdn) {
        let current_row = locals[cdt][cdn];
        let is_duplicate = false;

        frm.doc.selected_items.forEach((row) => {
            if (row.item_code === current_row.item_code && row.name !== current_row.name) {
                is_duplicate = true;
            }
        });

        if (is_duplicate) {
            frappe.msgprint(__('This item is already selected.'));
            frappe.model.set_value(cdt, cdn, 'item_code', '');
        }
    }
});