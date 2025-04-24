frappe.ui.form.on('Rejected Items', {
    onload: function (frm) {
        // Disable row actions in the child table
        frm.fields_dict['transaction_history'].grid.only_sortable();
    },
    submit: function (frm) {
        // add_row(frm);
        // update_qty(frm);
        stock_tranfer(frm);
    },
});


function stock_tranfer(frm) {
    let total_qty = parseInt(frm.doc.total_rejected_qty) || 0;

    let scrab_total_qty = parseInt(frm.doc.scrab_total_qty) || 0;
    let rtv_total_qty = parseInt(frm.doc.rtv_total_qty) || 0;
    let move_qty = parseInt(frm.doc.move_qty) || 0;


    let plused_qty = scrab_total_qty + rtv_total_qty + move_qty;

    if (move_qty > 0) {
        console.log("involke1");
        if (total_qty >= plused_qty) {
            console.log("involke2");
            if (frm.doc.move_to == "Scrab") {
                console.log("involke3");
                add_row(frm);
                update_qty(frm);
            } else if (frm.doc.move_to == "Return To Vendor") {
                console.log("involke4");
                get_parent_purchaser_receipt_item(frm);
            }
        } else {
            frappe.msgprint(__('Invalid entry: Ensure total quantity is sufficient and entered quantity is greater than zero.'));
        }
    } else {
        frappe.msgprint(__('Invalid entry: Entered Qty is not be Zero'));
    }
}

function add_row(frm) {
    const parent_id = frm.doc.name; // Parent ID (e.g., MVQI####)
    const child_reference_id = `TH${parent_id.slice(-4)}${String(frm.doc.transaction_history.length + 1).padStart(3, '0')}`;
    console.log("time:", frappe.datetime.now_datetime());


    let new_row_data = {
        transcation_id: child_reference_id, // Generated Reference ID
        date: frappe.datetime.now_date(), // Current Date in YYYY-MM-DD format
        time: frappe.datetime.now_time(), // Current Time in HH:mm:ss format
        // warehouse: target_warehouse, // Replace with your source field or value
        action: frm.doc.move_to,
        quantity: frm.doc.move_qty,
        // stock_transfered_id: stock_ref_id || 0
    };

    let new_row = frm.add_child('transaction_history', new_row_data);
    frm.refresh_field('transaction_history');
    frappe.msgprint(__('New row added to Transaction History!'));
}


function update_qty(frm) {
    let scrab_total_qty = parseInt(frm.doc.scrab_total_qty) || 0;
    let rtv_total_qty = parseInt(frm.doc.rtv_total_qty) || 0;
    let move_qty = parseInt(frm.doc.move_qty) || 0;
    let action = frm.doc.move_to;


    if (action === "Scrab") {
        value = scrab_total_qty + move_qty;
        fieldname = "scrab_total_qty";
    } else if (action === "Return To Vendor") {
        value = rtv_total_qty + move_qty;
        fieldname = "rtv_total_qty";
    }

    console.log("field name", fieldname);
    console.log("value", value);
    frm.set_value(fieldname, value);
    save_frm(frm);
}


function checkStatusCompleted(frm) {

    let totalSrab = parseFloat(frm.doc.scrab_total_qty) || 0;
    let totalRejQty = parseFloat(frm.doc.rtv_total_qty) || 0;

    let grandTotl = parseFloat(frm.doc.total_rejected_qty) || 0;
    console.log("ts", totalSrab);
    console.log("trq", totalRejQty);
    console.log("gt", grandTotl);
    if (grandTotl <= totalSrab + totalRejQty) {
        frm.set_value("status", "Completed");
    }else {
        frm.set_value("status", "Pending");
    }
}

function save_frm(frm) {
    checkStatusCompleted(frm);
    frm.save_or_update({
        callback: function (response) {
            if (response) {
                frappe.msgprint(__('Document {0} saved successfully.', [frm.doc.name]));
                frm.refresh();  // Refresh the form to reflect the latest saved state
            } else {
                frappe.msgprint(__('Failed to save the document.'));
            }
        },
        error: function (error) {
            frappe.msgprint(__('An error occurred while saving the document: {0}', [error.message]));
        }
    });
}


function get_parent_purchaser_receipt_item(frm) {
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Purchase Receipt',
            name: frm.doc.purchase_receipt_no
        },
        callback: function (response) {
            if (response.message) {
                // Filter items based on the item code
                let filtered_items = response.message.items.filter(item => item.item_code === frm.doc.item_code); // Replace with desired item code
                console.log('Filtered Items:', filtered_items);
                return_purchase_receipt(frm, filtered_items[0].name);
            }
        }
    });
}

function return_purchase_receipt(frm, pr_item_name) {

    getDefaultCompanyWarehouses(frappe.session.user)
        .then((warehouses) => {
            let rejected_warehouse = "";
            let supplier_inv_no = "";

            console.log("w h", warehouses);
            rejected_warehouse = warehouses[0].custom_rejected_item;

            if (!rejected_warehouse) {
                throw "Missing warehouse info";
            }

            rejected_qty = -parseInt(frm.doc.move_qty);

            console.log("r qty", rejected_qty);
            console.log("r wrh", rejected_warehouse);
            // console.log(frm.doc.purchase_receipt_no);
            // console.log("rj qty", rejected_qty);

            // if (frm.doc.supplier_delivery_note) { 
            frappe.db.get_value('Purchase Receipt', frm.doc.purchase_receipt_no, 'supplier_delivery_note')
                .then(r => {
                    if (r.message) {


                        frappe.db.get_list('Employee', {
                            filters: {
                                user_id: frappe.session.user
                            },
                            fields: ['company'],
                            limit_page_length: 1
                        }).then((result) => {
                            console.log("res", result);
                            let company = result[0].company;
                            supplier_inv_no = r.message.supplier_delivery_note;
                            console.log("Supplier Delivery Note:", supplier_inv_no);
                            let id = "";

                            if (!company) {
                                frappe.throw(__('User company is not set. Please update your profile.'));
                                return;
                            }

                            console.log("Selected Company:", company);

                            let series_map = {
                                "REVURU FASTENERS PVT LTD": "PR-RF-.YY.-",
                                "MVD FASTENERS PRIVATE LIMITED": "PR-MV-25-26-"
                            };

                            if (series_map[company]) {
                                id = series_map[company];
                            }

                            console.log("s inv", supplier_inv_no);

                            frappe.call({
                                method: 'frappe.client.insert',
                                args: {
                                    doc: {
                                        doctype: 'Purchase Receipt',
                                        company: company,
                                        naming_series: id,
                                        supplier: frm.doc.supplier, // Replace with a valid Supplier name
                                        supplier_delivery_note: supplier_inv_no,
                                        posting_date: frappe.datetime.nowdate(),
                                        posting_time: frappe.datetime.now_time(),
                                        is_return: 1,
                                        return_against: frm.doc.purchase_receipt_no,
                                        items: [
                                            {
                                                item_code: frm.doc.item_code, // Replace with a valid item
                                                batch_no: frm.doc.batch_no,
                                                qty: rejected_qty,
                                                received_qty: rejected_qty,
                                                rejected_qty: 0,
                                                warehouse: rejected_warehouse,
                                                purchase_receipt_item: pr_item_name
                                            },
                                        ]
                                    }
                                },
                                callback: function (response) {
                                    if (response.message) {
                                        let purchase_receipt_name = response.message.name;
                                        frappe.msgprint(__('Purchase Receipt {0} created successfully!', [purchase_receipt_name]));

                                        frappe.call({
                                            method: 'frappe.client.submit',
                                            args: {
                                                doc: response.message
                                            },
                                            callback: function (submit_response) {
                                                if (submit_response.message) {
                                                    frappe.msgprint(__('Purchase Receipt {0} submitted successfully!', [submit_response.message.name]));
                                                    add_row(frm);
                                                    update_qty(frm);
                                                } else {
                                                    frappe.msgprint(__('Failed to submit the Purchase Receipt.'));
                                                }
                                            }
                                        });
                                    } else {
                                        frappe.msgprint(__('Failed to create the Purchase Receipt.'));
                                    }
                                }
                            });

                        });
                    }
                });
        })
        .catch(() => {
            throw "Missing warehouse info";
        });
    console.log("rejected_warehouse", rejected_warehouse);
}

function getDefaultCompanyWarehouses(user) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "get_default_company_warehouses",
            args: { user: user },
            callback: function (response) {
                const data = response.message;
                if (data && Array.isArray(data) && data.length > 0) {
                    resolve(data);
                } else {
                    reject("No data found for the user.");
                }
            },
            error: function (err) {
                reject(err);
            },
        });
    });
}