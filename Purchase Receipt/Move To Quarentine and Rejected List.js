frappe.ui.form.on('Purchase Receipt', {
    refresh: function (frm) {
        frm.add_custom_button(__('Move'), async function () {
            const totalItems = frm.doc.items.length;
            let processedCount = 0;
            let quar_id = "";
            let rej_id = "";
            let company = "";

            const result = await frappe.db.get_list('Employee', {
                filters: {
                    user_id: frappe.session.user
                },
                fields: ['company'],
                limit_page_length: 1
            });
            company = result[0].company;
            console.log("company", company);

            if (!company) {
                frappe.throw(__('User company is not set. Please update your profile.'));
                return;
            }

            console.log("Selected Company:", company);

            let series_map_qar_item = {
                "REVURU FASTENERS PVT LTD": "QR-RF-25-26-",
                "MVD FASTENERS PRIVATE LIMITED": "QR/MV/25-26-"
            };

            let series_map_rej_itm = {
                "REVURU FASTENERS PVT LTD": "RJ-RF-.YY.-",
                "MVD FASTENERS PRIVATE LIMITED": "RJ/MV/25-26-"
            };


            if (series_map_qar_item[company]) {
                quar_id = series_map_qar_item[company];
            }

            if (series_map_rej_itm[company]) {
                rej_id = series_map_rej_itm[company];
            }


            for (const item of frm.doc.items) {
                if (item.custom_is_deviated === "RJI") {
                    // const batchNo = await get_batch_no(item);
                    try {
                        await move_to_reject_frm(item, frm, rej_id);
                    } catch (error) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to create Rejected Item for {0}: {1}', [item.item_code, error.message]),
                            indicator: 'red',
                        });
                    }
                } else if (item.qty > 0 && item.custom_is_deviated === "YES") {
                    try {
                        await move_to_quarantine_frm(item, frm, quar_id);
                    } catch (error) {
                        frappe.msgprint({
                            title: __('Error'),
                            message: __('Failed to create Rejected Item for {0}: {1}', [item.item_code, error.message]),
                            indicator: 'red',
                        });
                    }

                }
                // Update processed count (if you want to track items)
                processedCount++;
            }

        }, __('Actions')); // Optional: Groups the button under "Actions"
    },
});

function get_batch_no(item) {
    return new Promise((resolve, reject) => {
        let batch_no = item.serial_and_batch_bundle;

        if (item.serial_and_batch_bundle) {
            batch_no = item.serial_and_batch_bundle;
        } else if (item.rejected_serial_and_batch_bundle) {
            batch_no = item.rejected_serial_and_batch_bundle;
        }

        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Serial and Batch Bundle",
                name: batch_no, // Use the Serial and Batch Bundle ID
            },
            callback: function (response) {
                if (response.message) {
                    const batchEntries = response.message.entries; // Extract entries array
                    if (batchEntries && batchEntries.length > 0) {
                        const batchNo = batchEntries[0].batch_no; // Get the first batch_no
                        resolve(batchNo); // Resolve the promise with the batch number
                    } else {
                        console.log("No batch entries found for Serial and Batch Bundle.");
                        resolve(null); // Resolve with null if no batch entries
                    }
                } else {
                    reject("Failed to fetch data for Serial and Batch Bundle.");
                }
            },
            error: function (error) {
                reject(error); // Reject the promise on error
            },
        });

    });
}

async function move_to_reject_frm(item, frm, rej_id) {
    try {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Rejected Items',
                        naming_series: rej_id,
                        batch_no: item.custom_item_batch_no,
                        item_code: item.item_code,
                        total_rejected_qty: item.qty,
                        purchase_receipt_no: frm.doc.name,
                        supplier: frm.doc.supplier,
                        docstatus: 0,
                    },
                },
                callback: function (response) {
                    if (response.message) {
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Rejected Items created for {0}', [item.item_code]),
                            indicator: 'green',
                        });
                        resolve(response.message);
                    } else {
                        reject(new Error(__('Server did not return a valid response.')));
                    }
                },
                error: function (error) {
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error("Error fetching batch number or inserting Rejected Items:", error);
        throw error; // Rethrow the error to propagate it
    }
}

async function move_to_quarantine_frm(item, frm, quar_id) {
    try {
        // const batchNo = await get_batch_no(item);
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Quarantine Items',
                        naming_series: quar_id,
                        batch_no: item.custom_item_batch_no,
                        item_code: item.item_code,
                        total_qty: item.qty,
                        purchase_reference_no: frm.doc.name,
                        supplier: frm.doc.supplier,
                        docstatus: 0,
                    },
                },
                callback: function (response) {
                    if (response.message) {
                        frappe.msgprint({
                            title: __('Success'),
                            message: __('Quarantine Items created for {0}', [item.item_code]),
                            indicator: 'green',
                        });
                        resolve(response.message);
                    } else {
                        reject(new Error(__('Server did not return a valid response.')));
                    }
                },
                error: function (error) {
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error("Error fetching batch number or inserting Rejected Items:", error);
        throw error; // Rethrow the error to propagate it
    }
}