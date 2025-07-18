frappe.ui.form.on('Request for Quotation', {
    refresh: function (frm) {
        frm.add_custom_button(__('Send RFQ Email'), function () {
            let emailList = frm.doc.suppliers
                .map(row => row.email_id)
                .filter(email => !!email)
                .join(", ");

            if (!emailList) {
                frappe.msgprint(__('No supplier email IDs found.'));
                return;
            }

            new frappe.views.CommunicationComposer({
                doc: frm.doc,
                subject: __("Request for Quotation: {0}", [frm.doc.name]),
                recipients: emailList,
                attach_document_print: true,
                email_template: "Request for Quotation",
                content: __("Dear Supplier,<br><br>Please find the Request for Quotation {0} attached.<br><br>Best regards,<br>{1}", [frm.doc.name, frappe.session.user_fullname])
            });
        });
    }
});