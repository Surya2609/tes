frappe.ui.form.on('Customer Issue Chat Child', {
    send: function (frm, cdt, cdn) {

        let row = locals[cdt][cdn];
        let currenttimeanddate = frappe.datetime.now_datetime();

        if (row.message != null) {
            if (row.text_person_id == null) {
                frappe.model.set_value(row.doctype, row.name, 'text_person_id', frappe.session.user || '');
                frappe.model.set_value(row.doctype, row.name, 'time_stamp', currenttimeanddate);

                frm.save().then(() => {
                    frm.reload_doc();
                });
            }

            if (frappe.session.user == row.text_person_id) {
                frm.save().then(() => {
                    frm.reload_doc();
                });
            }
        }
    },

    replay: function (frm, cdt, cdn) {
        // Add new row to the child table
        let row = locals[cdt][cdn];
        let message = row.message || "";
        let part1 = message.substring(0, 8);

        let new_row = frm.add_child('message');

        let row_index = frm.doc.message.findIndex(r => r.name === row.name);

        new_row.time_stamp = frappe.datetime.now_datetime();
        new_row.text_person_id = frappe.session.user;

        new_row.message = `Reply To (${part1}...)`;

        new_row.replay_line = row_index + 1;
        new_row.replay_message_for = row.message;
        frm.refresh_field('message');
    }
});