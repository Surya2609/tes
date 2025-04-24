frappe.ui.form.on('Quality Inspection', {
    on_submit: function (frm) {
        console.log("step 0");
        if (frm.doc.reference_type == "Purchase Receipt") {
            update_to_pr(frm);
        } else if (frm.doc.reference_type == "Delivery Note") {
            update_in_dn(frm);
        }
    }
});

function update_to_pr(frm) {
    frappe.call({
        method: 'get_quality_pending_pr_item',  // Replace with your actual method path
        args: {
            parent_name: frm.doc.reference_name  // Pass the parent reference name to fetch items
        },
        callback: function (r) {
            let data = r.message;
            console.log("data are here akjsdf", data);
            if (data.length === 0) {
                console.log("pr name", frm.doc.reference_name);        
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Purchase Receipt',
                        name: frm.doc.reference_name,  // The parent Purchase Receipt name
                        fieldname: 'custom_quality_status',  // Field to update
                        value: 'Quality Completed'  // Set the value to "Quality Completed"
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint(__('Quality Completed status updated for Purchase Receipt'));
                            frm.refresh_field('custom_quality_status');  // Refresh the field in the UI
                        }
                    }
                });
            } else {
                console.log('Not all items have completed quality inspection');
            }
        }
    });
}

function update_in_dn(frm) {
    console.log("step1");
    frappe.call({
        method: 'get_quality_pending_dn_item',  // Replace with your actual method path
        args: {
            parent_name: frm.doc.reference_name  // Pass the parent reference name to fetch items
        },
        callback: function (r) {
            let data = r.message;
            if (data.length === 0) {
                console.log("pr name", frm.doc.reference_name);
                // If all items have a quality inspection, update the Purchase Receipt's custom_quality_status
                frappe.call({
                    method: 'frappe.client.set_value',
                    args: {
                        doctype: 'Delivery Note',
                        name: frm.doc.reference_name,  // The parent Purchase Receipt name
                        fieldname: 'custom_quality_status',  // Field to update
                        value: 'Quality Completed'  // Set the value to "Quality Completed"
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint(__('Quality Completed status updated for Delivery Note'));
                            frm.refresh_field('custom_quality_status');  // Refresh the field in the UI
                        }
                    }
                });
            } else {
                console.log('Not all items have completed quality inspection');
            }
        }
    });
}
