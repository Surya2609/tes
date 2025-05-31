frappe.ui.form.on('Task', {
    custom_load: function (frm) {
        const selected_project = frm.doc.custom_select_project_tasks;

        if (selected_project) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Task",
                    filters: {
                        project: selected_project,
                        docstatus: ["<", 2]
                    },
                    fields: ["name", "subject", "status"]
                },
                callback: function (response) {
                    if (response.message && response.message.length > 0) {
                      
                       
                    } else {
                        frappe.msgprint("No tasks found for the selected project.");
                    }
                }
            });
        } else {
            frappe.msgprint("Please select a project first.");
        }
    }
});