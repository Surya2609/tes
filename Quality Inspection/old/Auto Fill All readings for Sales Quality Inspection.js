frappe.ui.form.on('Quality Inspection', {
    refresh: function (frm) {
        frm.add_custom_button(__('Fill Auto Readings'), function () {
            if (frm.doc.reference_type === "Delivery Note") {
                if (!frm.doc.item_code) {
                    frappe.msgprint(__('Please select an item code first.'));
                    return;
                }
                if (!frm.doc.batch_no) {
                    frappe.msgprint(__('Please select a batch number.'));
                    return;
                }
                if (!frm.doc.quality_inspection_template) {
                    frappe.msgprint(__('Please select a Quality Inspection Template.'));
                    return;
                }
                frappe.call({
                    method: 'fetch_reading_frm_pr_quality',
                    args: {
                        batch_no: frm.doc.batch_no
                    },
                    callback: function (response) {
                        if (response.message) {
                            const data = response.message;
                            console.log("reading output", response.message);
                            $.each(frm.doc.readings || [], function (index, row) {
                                $.each(data, function (i, template) {
                                    if (row.specification === template.specification) {
                                        console.log("Matched");
                                        for (let i = 1; i <= 10; i++) {
                                            let reading_field = `reading_${i}`;
                                            let reading_value = template[reading_field];
                                            if (reading_value !== null) {
                                                frappe.model.set_value(row.doctype, row.name, reading_field, reading_value);
                                            } else {
                                                frappe.model.set_value(row.doctype, row.name, reading_field, '');
                                            }
                                        }
                                    }
                                });
                            });
                        } else {
                            frappe.msgprint(__('No template found for this item code and batch number.'));
                        }
                    }
                });
            } else {
                frappe.msgprint(__('This is Apply For Delivery Note Only'));
            }
        });
    }
});
