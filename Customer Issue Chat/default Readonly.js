frappe.ui.form.on('Customer Issue Chat', {
    refresh: function (frm) {
        if (frm.is_new()) {
            frm.set_value('created_by', frappe.session.user);
        }

        const isCreator = frm.doc.created_by === frappe.session.user;

        frm.set_df_property("sales_invoice", 'read_only', !isCreator);
        frm.set_df_property("item_code", 'read_only', !isCreator);
        frm.set_df_property("issue_description", 'read_only', !isCreator);
        frm.set_df_property("status", 'read_only', !isCreator);
        frm.set_df_property("assigned_to", 'read_only', !isCreator);
        frm.set_df_property("assigned_person", 'read_only', !isCreator);
        frm.set_df_property("sales_person", 'read_only', !isCreator);

        if (frappe.session.user !== isCreator) {
            frm.disable_save(); // hides Save button
        } else {
            frm.enable_save();
        }
    }
});