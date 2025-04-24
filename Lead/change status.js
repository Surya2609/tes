frappe.ui.form.on('Lead', {
    after_save: function (frm) {
        console.log("Document Data:", frm.doc);
        let value = "Lead"; // Default value
        if (frm.doc.status) {
            if (frm.doc.status == "Converted") {
                value = "Hot";
            } else if (frm.doc.status == "Opportunity") {
                value = "Warm";
            }
        }

        frappe.db.set_value("Lead", frm.doc.name, "custom_status_new", value)
            .then(() => {
                frappe.show_alert({ message: __("Status Updated!"), indicator: "green" });
                frm.reload_doc();
            });
    }
});

frappe.ui.form.on('Opportunity', {
    after_save: function (frm) {
        console.log(frm.doc);
        if (frm.doc.party_name && frm.doc.party_name.startsWith("CRM-LEAD")) { // Assuming lead_name links to the Lead document
            frappe.call({
                method: 'frappe.client.get_value',
                args: {
                    doctype: 'Lead',
                    filters: { name: frm.doc.party_name },
                    fieldname: 'status'
                },
                callback: function (response) {
                    if (response.message) {
                        console.log(response.message);
                         current_status = response.message.status; // Get the current status from Lead
                        if (response.message.status != null) {
                            if (response.message.status == "Opportunity") {
                                current_status = "Warm";
                            } else if (response.message.status == "Converted") {
                                current_status = "Hot";
                            } else {
                                current_status = "Cold";
                            }
                        }

                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Lead',
                                name: frm.doc.party_name,
                                fieldname: 'custom_status_new',
                                value: current_status
                            },
                            callback: function (r) {}
                        });
                    }
                }
            });
        }
    }
});