frappe.ui.form.on('Task', {
    status: function (frm) {
        if (frm.doc.status == "Completed") {
            let currentDate = frappe.datetime.now_date();
            let currentUser = frappe.session.user;
            frm.set_value('completed_on', currentDate);
            frm.set_value('completed_by', currentUser);
        }
    },
    before_save: function (frm) {
        if (!frm.doc.custom_assigned_by) {
            console.log("invoked");
            frm.set_value('custom_assigned_by', frappe.session.user);
        }
    },
    onload: function (frm) {
        set_user_company(frm);
        set_lead_filter_user_based(frm);
    },
    refresh: function (frm) {
        frm.toggle_display('custom_assigned_by', frm.doc.__islocal ? 0 : 1);
        let currentUser = frappe.session.user;
        frm.set_df_property("completed_on", "read_only", 1);
        if (frm.doc.owner === currentUser) {
            frm.set_df_property("status", "read_only", 0); // Editable
        } else {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "ToDo",
                    filters: {
                        reference_type: "Task",
                        reference_name: frm.doc.name,
                        allocated_to: currentUser // Check if current user is assigned
                    },
                    fields: ["allocated_to"]
                },
                callback: function (response) {
                    if (response.message.length > 0) {
                        set_read_only_for_assigned_person(frm);
                    } else {
                        set_read_only_others(frm);
                    }
                }
            });
        }
    }
});

function set_read_only_for_assigned_person(frm) {
    frm.set_df_property("status", "read_only", 0);
    read_only(frm);
}

function set_read_only_others(frm) {
    frm.set_df_property("status", "read_only", 1);
    read_only(frm);
}

function read_only(frm) {
    frm.set_df_property("subject", "read_only", 1);
    frm.set_df_property("department", "read_only", 1);
    frm.set_df_property("custom_task_type", "read_only", 1);
    frm.set_df_property("priority", "read_only", 1);
    frm.set_df_property("task_weight", "read_only", 1);
    frm.set_df_property("parent_task", "read_only", 1);
    frm.set_df_property("custom_lead", "read_only", 1);
    frm.set_df_property("project", "read_only", 1);
    frm.set_df_property("issue", "read_only", 1);
    frm.set_df_property("type", "read_only", 1);
    frm.set_df_property("is_group", "read_only", 1);
    frm.set_df_property("is_template", "read_only", 1);
    frm.set_df_property("exp_start_date", "read_only", 1);
    frm.set_df_property("exp_end_date", "read_only", 1);
    frm.set_df_property("expected_time", "read_only", 1);
    frm.set_df_property("progress", "read_only", 1);

    frm.set_df_property("is_milestone", "read_only", 1);
    frm.set_df_property("depends_on", "read_only", 1);
    frm.set_df_property("actual_time", "read_only", 1);
}

function set_user_company(frm) {
    if (frm.is_new()) {
        let user_company = "";
        user_company = frappe.defaults.get_user_default("Company");
        console.log("u c", user_company);
        frm.set_value("company", user_company);
    }
}

function set_lead_filter_user_based(frm) {
    frm.set_query("custom_lead", function () {
        return {
            filters: {
                owner: frappe.session.user
            }
        };
    });
}