frappe.ui.form.on('Quarantine Items', {
    onload: function (frm) {
        frm.fields_dict['transcation_history'].grid.only_sortable();
    },
    submit: function (frm) {
        stock_tranfer(frm);
    },
    refresh: function (frm) {
        if (frm.doc.segregated_qty > 0 || frm.doc.reworked_qty > 0) {
            frm.add_custom_button(__('Update Stocks'), function () {
                show_update_stocks_dialog(frm);
            });
        }
    },
});

function show_update_stocks_dialog(frm) {
    const dialog = new frappe.ui.Dialog({
        title: __('Update Stocks'),
        fields: [
            {
                label: __('Action From'),
                fieldname: 'action',
                fieldtype: 'Select',
                options: ['Segregate', 'Rework'],
                default: 'Segregate',
                reqd: 1,
                change: function () {

                    update_total_qty(dialog, frm);
                }
            },
            {
                label: __('Action To'),
                fieldname: 'action_to',
                fieldtype: 'Select',
                options: ['Accept', 'Reject'], // Options for Action To
                default: 'Accept', // Default value set to 'Accept'
                reqd: 1,
                change: function () {
                    const action_to = dialog.get_value('action_to');
                    if (action_to === 'Reject') {
                        dialog.set_df_property('warehouse', 'hidden', 1);
                    } else {
                        dialog.set_df_property('warehouse', 'hidden', 0);
                    }
                }
            },
            {
                label: __('Total Qty'),
                fieldname: 'total_qty',
                fieldtype: 'Float',
                read_only: 1,
                default: frm.doc.segregated_qty || 0
            },
            {
                label: __('Qty'),
                fieldname: 'qty',
                fieldtype: 'Float',
                default: 1,
                reqd: 1
            },
            {
                label: __('Select Warehouse'),
                fieldname: 'warehouse',
                fieldtype: 'Link',
                options: 'Warehouse',
                reqd: 0
            }
        ],
        primary_action_label: __('Submit'),
        primary_action: function (values) {
            handle_update_stocks(values, frm);
            dialog.hide();
        }
    });
    update_total_qty(dialog, frm);
    dialog.show();
}


function update_total_qty(dialog, frm) {
    const action = dialog.get_value('action');
    let total_qty = 0;
    if (action === 'Segregate') {
        total_qty = frm.doc.segregated_qty || 0;
    } else if (action === 'Rework') {
        total_qty = frm.doc.reworked_qty || 0;
    }
    dialog.set_value('total_qty', total_qty);
}

function handle_update_stocks(values, frm) {
    const { action, qty, warehouse, action_to } = values;
    console.log('Action:', action);
    console.log('Total Qty:', values.total_qty);
    console.log('Quantity:', qty);
    console.log('Warehouse:', warehouse);
    console.log('action to:', action_to);

    stock_transfer_for_update(frm, qty, action_to, warehouse, action);

}

function get_default_warehouse(frm) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Item",
                name: frm.doc.item_code
            },
            callback: function (response) {
                if (response.message) {
                    let item = response.message;

                    let default_warehouse = null;
                    if (item.item_defaults && item.item_defaults.length > 0) {
                        default_warehouse = item.item_defaults[0].default_warehouse; // Assuming the first entry
                    }

                    if (default_warehouse) {
                        // Resolve the promise with the default warehouse
                        resolve(default_warehouse);
                    } else {
                        // If no default warehouse, reject the promise
                        reject(__('No default warehouse found. Please select a Source Warehouse.'));
                    }
                } else {
                    reject(__('Item not found.'));
                }
            }
        });
    });
}

function stock_transfer_for_update(frm, qty, action_to, warehouse, action) {
    let segregated_qty = parseInt(frm.doc.segregated_qty) || 0;
    let reworked_qty = parseInt(frm.doc.reworked_qty) || 0;
    if (qty > 0) {
        if (segregated_qty >= qty || reworked_qty >= qty) {
            // let user_company = frappe.defaults.get_user_default("Company");



            getDefaultCompanyWarehouses(frappe.session.user)
                .then((warehouses) => {
                    let quarentine_warehouse = "";
                    let rejected_warehouse = "";


                    console.log("wr", warehouses);
                    quarentine_warehouse = warehouses[0].custom_work_in_process;
                    rejected_warehouse = warehouses[0].custom_rejected_item;

                    console.log("qr w", quarentine_warehouse);
                    console.log("rj w", rejected_warehouse);

                    if (!quarentine_warehouse || !rejected_warehouse) {
                        throw "Missing warehouse info";
                    }


                    if (action_to == "Accept") {
                        if (frm.doc.item_code) {
                            if (warehouse) {
                                stock_in(frm, qty, quarentine_warehouse, warehouse, true, false, qty, action_to, action);
                            } else {
                                get_default_warehouse(frm)
                                    .then(default_warehouse => {
                                        stock_in(frm, qty, quarentine_warehouse, default_warehouse, true, false, qty, action_to, action);
                                    })
                                    .catch(error => {
                                        console.log("Error: ", error);
                                        frappe.msgprint(error);
                                    });
                            }
                        }
                    } else if (action_to == "Reject") {
                        if (frm.doc.item_code) {
                            stock_in(frm, qty, quarentine_warehouse, rejected_warehouse, true, true, qty, action_to, action);
                        }
                    }
                    save_frm(frm);
                })
                .catch(() => {
                    throw "Missing warehouse info";
                });

            // quarentine_warehouse = wip;
            // rejected_warehouse = rji;
            // console.log("quarentine_warehouse", quarentine_warehouse);
            // console.log("rejected_warehouse", rejected_warehouse);
            // if (user_company == "MVD FASTENERS PVT LTD (Demo)") {
            //     quarentine_warehouse = "Work In Progress - MFPL";
            //     rejected_warehouse = "Rejected Item - MFPL";
            // } else if (user_company == "REVURU FASTENERS PVT LTD") {
            //     quarentine_warehouse = "Work In Progress - RFPL";
            //     rejected_warehouse = "Rejected Item - RFPL";
            // } else {
            //     quarentine_warehouse = "";
            //     rejected_warehouse = "";
            // }


        } else {
            frappe.msgprint(__('Invalid entry: Ensure total quantity is sufficient and entered quantity is greater than zero.'));
        }
    } else {
        frappe.msgprint(__('Invalid entry: Entered Qty is not be Zero'));
    }
}

function stock_tranfer(frm) {
    let total_qty = parseInt(frm.doc.total_qty) || 0;
    let accepted_qty = parseInt(frm.doc.accepted_qty) || 0;
    let segregated_qty = parseInt(frm.doc.segregated_qty) || 0;
    let reworked_qty = parseInt(frm.doc.reworked_qty) || 0;
    let rejected_qty = parseInt(frm.doc.rejected_qty) || 0;
    let entered_qty = parseInt(frm.doc.enter_qty) || 0;

    let type = frm.doc.select_transcation;

    let plused_qty = segregated_qty + reworked_qty + rejected_qty + accepted_qty + entered_qty;

    if (entered_qty > 0) {
        if (total_qty >= plused_qty) {

            getDefaultCompanyWarehouses(frappe.session.user)
                .then((warehouses) => {
                    let quarentine_warehouse = "";
                    let rejected_warehouse = "";

                    console.log("wr", warehouses);
                    quarentine_warehouse = warehouses[0].custom_work_in_process;
                    rejected_warehouse = warehouses[0].custom_rejected_item;

                    console.log("qr w", quarentine_warehouse);
                    console.log("rj w", rejected_warehouse);

                    if (!quarentine_warehouse || !rejected_warehouse) {
                        throw "Missing warehouse info";
                    }


                    if (frm.doc.select_transcation == "Segregate") {
                        add_row(frm, "segregated", quarentine_warehouse);
                        update_qty(frm);
                    } else if (frm.doc.select_transcation == "Rework") {
                        add_row(frm, "reworked", quarentine_warehouse);
                        update_qty(frm);
                    } else if (frm.doc.select_transcation == "Accept") {
                        console.log("involke");
                        if (frm.doc.select_warehouse) {
                            console.log("involke", frm.doc.select_warehouse);
                            stock_in(frm, entered_qty, quarentine_warehouse, frm.doc.select_warehouse, false, false);
                        } else {
                            get_default_warehouse(frm)
                                .then(default_warehouse => {
                                    stock_in(frm, entered_qty, quarentine_warehouse, default_warehouse, false, false);
                                })
                                .catch(error => {
                                    console.log("Error: ", error);
                                    frappe.msgprint(error);
                                });
                        }
                    } else if (frm.doc.select_transcation == "Reject") {
                        stock_in(frm, entered_qty, quarentine_warehouse, rejected_warehouse, false, false);
                    }

                    save_frm(frm);
                })
                .catch(() => {
                    throw "Missing warehouse info";
                });

            // save_frm(frm);
        } else {
            frappe.msgprint(__('Invalid entry: Ensure total quantity is sufficient and entered quantity is greater than zero.'));
        }
    } else {
        frappe.msgprint(__('Invalid entry: Entered Qty is not be Zero'));
    }
}

function checkStatusCompleted(frm) {
    let totalRjQty = parseFloat(frm.doc.rejected_qty) || 0;
    let totalAcceptQty = parseFloat(frm.doc.accepted_qty) || 0;

    let grandTotl = parseFloat(frm.doc.total_qty) || 0;

    console.log("ts", totalSrab);
    console.log("trq", totalRejQty);
    console.log("gt", grandTotl);

    if (grandTotl <= totalRjQty + totalAcceptQty) {
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

    // frappe.call({
    //     method: "frappe.client.save",
    //     args: {
    //         doc: frm.doc 
    //     },
    //     callback: function (response) {
    //         if (response.message) {
    //             frappe.msgprint(__('Document saved successfully with name: {0}', [response.message.name]));
    //         } else {
    //             frappe.msgprint(__('Failed to save the document.'));
    //         }
    //     }
    // });
}


//  quarentine_warehouse = wip;
//  rejected_warehouse = rji;
// console.log("quarentine_warehouse", quarentine_warehouse);
// console.log("rejected_warehouse", rejected_warehouse);
// let user_company = frappe.defaults.get_user_default("Company");

// if (user_company == "MVD FASTENERS PRIVATE LIMITED") {
//     quarentine_warehouse = "Work In Progress - MFPL";
//     rejected_warehouse = "Rejected Item - MFPL";
// } else if (user_company == "REVURU FASTENERS PVT LTD") {
//     quarentine_warehouse = "Work In Progress - RFPL";
//     rejected_warehouse = "Rejected Item - RFPL";
// } else {
//     quarentine_warehouse = "";
//     rejected_warehouse = "";
// }


function stock_in(frm, entered_qty, quarentine_warehouse, target_warehouse, is_update, move_to_reject, qty = null, action_to = null, action = null) {
    console.log("st in qw", quarentine_warehouse);
    console.log("s in t war", target_warehouse);

    frappe.db.get_list('Employee', {
        filters: {
            user_id: frappe.session.user
        },
        fields: ['company'],
        limit_page_length: 1
    }).then((result) => {
        console.log("res", result);
        company = result[0].company;

        let stock_id = "";

        if (!company) {
            frappe.throw(__('User company is not set. Please update your profile.'));
            return;
        }

        console.log("Selected Company:", company);

        let series_map = {
            "REVURU FASTENERS PVT LTD": "RF-ST-.FY.-",
            "MVD FASTENERS PRIVATE LIMITED": "MV/ST/25-26-"
        };

        if (series_map[company]) {
            stock_id = series_map[company];
        }
        
        console.log(items);

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Stock Entry",
                    company: company,
                    naming_series: stock_id,
                    stock_entry_type: "Material Transfer",
                    from_bom: 0,
                    items: [
                        {
                            item_code: frm.doc.item_code, // The item being transferred
                            qty: entered_qty,
                            s_warehouse: quarentine_warehouse, // Source Warehouse
                            t_warehouse: target_warehouse // Target Warehouse
                        }
                    ]
                }
            },
            callback: function (response) {
                if (response.message) {
                    frappe.call({
                        method: "frappe.client.submit",
                        args: {
                            doc: response.message
                        },
                        callback: function (submit_response) {
                            if (submit_response.message) {
                                frappe.msgprint(__('Stock Entry {0} submitted successfully.', [response.message.name]));
                                if (frm.doc.select_transcation == "Reject" || move_to_reject) {
                                    move_to_reject_frm(frm);
                                }
                                add_row(frm, response.message.name, target_warehouse, qty, action_to);
                                if (is_update == false) {
                                    update_qty(frm);
                                } else {
                                    update_qty_for_updates(frm, qty, action_to, action);
                                }
                            } else {
                                frappe.msgprint(__('Failed to submit the Stock Entry.'));
                            }
                        }
                    });
                } else {
                    frappe.msgprint(__('Failed to transfer.'));
                }
            }
        });
    });
}

async function move_to_reject_frm(frm) {
    return new Promise((resolve, reject) => {
        frappe.db.get_list('Employee', {
            filters: {
                user_id: frappe.session.user
            },
            fields: ['company'],
            limit_page_length: 1
        }).then((result) => {
            let rej_id = "";
            let company = result[0].company;
            if (!company) {
                frappe.throw(__('User company is not set. Please update your profile.'));
                return;
            }

            console.log("Selected Company:", company);

            let series_map_rej_itm = {
                "REVURU FASTENERS PVT LTD": "RJ-RF-25-26-",
                "MVD FASTENERS PRIVATE LIMITED": "RJ/MV/25-26-"
            };

            if (series_map_rej_itm[company]) {
                rej_id = series_map_rej_itm[company];
            }

            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Rejected Items',
                        naming_series: rej_id,
                        batch_no: frm.doc.batch_no,
                        item_code: frm.doc.item_code,
                        total_rejected_qty: frm.doc.enter_qty,
                        purchase_receipt_no: frm.doc.purchase_reference_no,
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
    });
}

function update_qty_for_updates(frm, qty, action_to, action) {
    let accepted_qty = parseInt(frm.doc.accepted_qty) || 0;
    let segregated_qty = parseInt(frm.doc.segregated_qty) || 0;
    let reworked_qty = parseInt(frm.doc.reworked_qty) || 0;
    let rejected_qty = parseInt(frm.doc.rejected_qty) || 0;

    if (action == "Segregate" && action_to == "Accept") {
        value1 = segregated_qty - qty;
        value2 = accepted_qty + qty;
        fieldname1 = "segregated_qty";
        fieldname2 = "accepted_qty";
    } else if (action == "Segregate" && action_to == "Reject") {
        value1 = segregated_qty - qty;
        value2 = rejected_qty + qty;
        fieldname1 = "segregated_qty";
        fieldname2 = "rejected_qty";
    } else if (action == "Rework" && action_to == "Accept") {
        value1 = reworked_qty - qty;
        value2 = accepted_qty + qty;
        fieldname1 = "reworked_qty";
        fieldname2 = "accepted_qty";
    } else if (action == "Rework" && action_to == "Reject") {
        value1 = reworked_qty - qty;
        value2 = rejected_qty + qty;
        fieldname1 = "reworked_qty";
        fieldname2 = "rejected_qty";
    }
    frm.set_value(fieldname1, value1);
    frm.set_value(fieldname2, value2);
    save_frm(frm);
}

function update_qty(frm) {
    let total_qty = parseInt(frm.doc.total_qty) || 0;
    let accepted_qty = parseInt(frm.doc.accepted_qty) || 0;
    let segregated_qty = parseInt(frm.doc.segregated_qty) || 0;
    let reworked_qty = parseInt(frm.doc.reworked_qty) || 0;
    let rejected_qty = parseInt(frm.doc.rejected_qty) || 0;
    let entered_qty = parseInt(frm.doc.enter_qty) || 0;

    let type = frm.doc.select_transcation;

    if (type === "Accept") {
        value = accepted_qty + entered_qty;
        fieldname = "accepted_qty";
    } else if (type === "Segregate") {
        value = segregated_qty + entered_qty;
        fieldname = "segregated_qty";
    } else if (type === "Rework") {
        value = reworked_qty + entered_qty;
        fieldname = "reworked_qty";
    } else {
        value = rejected_qty + entered_qty;
        fieldname = "rejected_qty";
    }
    console.log("field name", fieldname);
    console.log("value", value);
    frm.set_value(fieldname, value);
    save_frm(frm);
}

function add_row(frm, stock_ref_id, target_warehouse, update_area_qty = null, update_area_status = null) {
    const parent_id = frm.doc.name; // Parent ID (e.g., MVQI####)
    const child_reference_id = `TH${parent_id.slice(-4)}${String(frm.doc.transcation_history.length + 1).padStart(3, '0')}`;
    console.log("time:", frappe.datetime.now_datetime());


    let new_row_data = {
        reference_id: child_reference_id, // Generated Reference ID
        datetime: frappe.datetime.now_date(), // Current Date in YYYY-MM-DD format
        time: frappe.datetime.now_time(), // Current Time in HH:mm:ss format
        warehouse: target_warehouse, // Replace with your source field or value
        status: update_area_status == null ? frm.doc.select_transcation : update_area_status,
        quantity: update_area_qty == null ? frm.doc.enter_qty : update_area_qty,
        stock_transfered_id: stock_ref_id || 0,
        assigned_by: frm.doc.work_assigned_by || ""
    };

    let new_row = frm.add_child('transcation_history', new_row_data);
    frm.refresh_field('transcation_history');
    frappe.msgprint(__('New row added to Transaction History!'));
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