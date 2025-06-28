frappe.ui.form.on('Sales Invoice', {
    refresh: function (frm) {
        frm.add_custom_button('Email Customer', function () {
            frappe.call({
                method: "frappe.desk.form.load.get_attachments",
                args: {
                    doctype: frm.doctype,
                    name: frm.doc.name
                },
                callback: function () {
                    frappe.call({
                        method: "frappe.core.doctype.communication.email.make",
                        args: {
                            doctype: frm.doctype,
                            name: frm.doc.name
                        },
                        callback: function (res) {
                            const email_doc = res.message;
                            email_doc.recipients = email;
                            email_doc.subject = "Invoice: " + frm.doc.name;
                            email_doc.content = "Dear Customer,<br><br>Please find your invoice attached.<br><br>Regards,<br>" + frappe.boot.user.name;

                            frappe.new_doc("Email", email_doc);
                        }
                    });
                }
            });
        });
    }
});