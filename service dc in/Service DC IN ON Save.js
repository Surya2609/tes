frappe.ui.form.on('Service DC IN', {
    refresh: function (frm) {


   if (frm.is_new() && !frm.doc.date) {
            frm.set_value('date', frappe.datetime.get_today());
        }

        if (frm.doc.dc_status === "Completed") {
            frm.add_custom_button("Create Purchase Invoice", function () {
                frappe.model.with_doctype("Purchase Invoice", function () {

                    frappe.db.get_list('Employee', {
                        filters: {
                            user_id: frappe.session.user
                        },
                        fields: ['company'],
                        limit_page_length: 1
                    }).then((result) => {
                        company = result[0].company;

                        let series_map = {
                            "REVURU FASTENERS PVT LTD": "PI-RF-.YY.-",
                            "MVD FASTENERS PRIVATE LIMITED": "PI/MV/25-26-"
                        };

                        var new_doc = frappe.model.get_new_doc("Purchase Invoice");
                        
                        new_doc.company = company;
                        new_doc.naming_series = series_map[company];
                        new_doc.supplier = frm.doc.supplier;
                        new_doc.bill_no = frm.doc.supplier_dc_ids;
                        new_doc.bill_date = frm.doc.date;
                        frm.doc.items.forEach(row => {
                            let new_item = frappe.model.add_child(new_doc, "Purchase Invoice Item", "items");
                            new_item.item_code = row.item;
                            new_item.item_name = row.item_description;
                            new_item.qty = row.total_qty;
                        });

                        // Save the new document and redirect to it
                        frappe.set_route("Form", "Purchase Invoice", new_doc.name);

                    })


                });
            });
        }
    },

    validate: function (frm) {
        let allValid = true;
        frm.doc.items.forEach((row, index) => {
            if (!row.qty || row.qty == "0" || !row.source_warehouse || !row.target_warehouse || !row.uom || !row.item) {
                frappe.msgprint(__('Row {0}: Please fill all mandatory fields (Qty, Server For, Source Warehouse, Target Warehouse, Item).', [index + 1]));
                allValid = false;
            }
        });

        if (!allValid) {
            frappe.validated = false;
            return;
        }

        // Perform asynchronous validation and set frappe.validated accordingly
        return validation(frm).then((result) => {
            if (result) {
                frappe.validated = true;
            } else {
                frappe.validated = false;
            }
        }).catch(() => {
            frappe.msgprint(__('Validation failed. Save operation aborted.'));
            frappe.validated = false;
        });
    },
    // before_submit
    before_submit: function (frm) {
        status_validation(frm);
        if (frm.doc.dc_status !== "Completed") {
            frappe.msgprint(__('Cannot submit because the status is not "Completed".'));
            frappe.validated = false;  // Prevent form submission
        }
    }
});


function add_purchase_invoice(frm) {
    // Build the items array from the child table
    let items = frm.doc.items.map(row => ({
        item_code: row.item,
        qty: row.total_qty,
    }));


    frappe.db.get_list('Employee', {
        filters: {
            user_id: frappe.session.user
        },
        fields: ['company'],
        limit_page_length: 1
    }).then((result) => {


        console.log("itms", items);

        console.log("res", result);
        company = result[0].company;

        let series_map = {
            "REVURU FASTENERS PVT LTD": "PI-RF-.YY.-",
            "MVD FASTENERS PRIVATE LIMITED": "PI/MV/25-26-",
            "REVURU PRECISION LLP": "PI-RPL-25-26-"
        };

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Purchase Invoice",
                    naming_series: series_map[company],
                    supplier: frm.doc.supplier,
                    items: items
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
                                frappe.msgprint(__('Purchase Invoice submitted successfully: ' + submit_response.message.name));
                                get_submited_st_entry(frm, submit_response.message.name);
                            } else {
                                frappe.msgprint(__('Failed to submit the Purchase Invoice.'));
                            }
                        }
                    });
                } else {
                    frappe.msgprint(__('Failed to create Purchase Invoice.'));
                }
            }
        });

    })

   
}

function validation(frm) {
    return new Promise((resolve, reject) => {
        if (frm.doc.items) {
            let current_items = frm.doc.items;
            let allValid = true;
            let exceededItems = [];

            current_items.forEach(row_item => {
                let totalQty = parseFloat(row_item.total_qty) || 0;
                let balanceQty = parseFloat(row_item.balance_qty) || 0;

                let rej_qty = parseFloat(row_item.rejected_qty) || 0;

                let accepeted_qty = parseFloat(row_item.qty) || 0;

                let givenQty = accepeted_qty + rej_qty;

                let new_balance = balanceQty - givenQty;

                if (new_balance < 0) {
                    exceededItems.push({
                        item_code: row_item.item,
                        givenQty: givenQty,
                        balanceQty: balanceQty,
                        totalQty: totalQty
                    });
                    allValid = false;
                }
            });

            // If no exceeded items, proceed directly
            if (allValid) {
                stock_transfer_in(frm).then(() => {
                    resolve(true);
                }).catch(() => {
                    reject(false);
                });
            } else {
                // Prepare the message for all exceeded items
                let message = exceededItems.map(item =>
                    `Item Code ${item.item_code} exceeds the quantity. Given: ${item.givenQty}, Balance: ${item.balanceQty}, Total: ${item.totalQty}`
                ).join('<br>');

                // Show the confirmation dialog once
                frappe.confirm(
                    __(message + '<br><br>Do you want to proceed anyway?'),
                    function () {
                        // If user clicks "OK", proceed to next step
                        stock_transfer_in(frm).then(() => {
                            resolve(true);
                        }).catch(() => {
                            reject(false);
                        });
                    },
                    function () {
                        // If user clicks "Cancel", stop further execution
                        frappe.msgprint(__('Operation cancelled.'));
                        reject(false);
                    }
                );
            }
        } else {
            reject(false);
        }
    });
}


function status_validation(frm) {
    if (frm.doc.items) {
        let current_items = frm.doc.items;
        let allCompleted = true;  // Start with true

        current_items.forEach(row_item => {
            let balanceQty = parseFloat(row_item.balance_qty) || 0;
            console.log("balanceQty", balanceQty);
            if (balanceQty != 0) {
                allCompleted = false;  // If any item has a balance, set to false
                return false;  // Exit loop early
            }
        });

        if (allCompleted) {
            frm.set_value('dc_status', 'Completed');
        }
    }
}

function stock_transfer_in(frm) {
    return new Promise((resolve, reject) => {
        let items = [];
        frm.doc.items.forEach(item => {

            let rej_qty = parseFloat(item.rejected_qty) || 0;

            if (rej_qty > 0) {
                if (item.qty > 0) {

                    items.push({
                        uom: item.uom,
                        item_code: item.item,
                        qty: item.qty,
                        s_warehouse: item.source_warehouse,  // Source warehouse
                        t_warehouse: item.target_warehouse   // Target warehouse
                    });

                    items.push({
                        uom: item.uom,
                        item_code: item.item,
                        qty: rej_qty,
                        s_warehouse: item.source_warehouse,  // Source warehouse
                        t_warehouse: item.rejected_warehouse !== null && item.rejected_warehouse !== undefined
                            ? item.rejected_warehouse
                            : (frm.doc.rejected_warehouse !== null && frm.doc.rejected_warehouse !== undefined
                                ? frm.doc.rejected_warehouse
                                : "Rejected Items - MVDF")
                    });
                }
            } else {
                if (item.qty > 0) {
                    items.push({
                        uom: item.uom,
                        item_code: item.item,
                        qty: item.qty,
                        s_warehouse: item.source_warehouse,  // Source warehouse
                        t_warehouse: item.target_warehouse   // Target warehouse
                    });
                }
            }


        });

        if (items.length === 0) {
            frappe.msgprint(__('No items to transfer.'));
            reject(false);  // Reject when no items to transfer
            return;
        }

        frappe.db.get_list('Employee', {
            filters: {
                user_id: frappe.session.user
            },
            fields: ['company'],
            limit_page_length: 1
        }).then((result) => {
            console.log("itms", items);

            console.log("res", result);
            company = result[0].company;

            let series_map = {
                "REVURU FASTENERS PVT LTD": "RF-ST-25-26-",
                "MVD FASTENERS PRIVATE LIMITED": "MV/ST/25-26-",
                "REVURU PRECISION LLP": "RPL-ST-25-26-"
            };

            frappe.call({
                method: "frappe.client.insert",
                args: {
                    doc: {
                        doctype: "Stock Entry",
                        naming_series: series_map[company],
                        stock_entry_type: "Material Transfer",
                        company: company,
                        from_bom: 0,
                        items: items
                    }
                },
                callback: async function (response) {
                    if (response.message) {
                        frappe.call({
                            method: "frappe.client.submit",
                            args: {
                                doc: response.message
                            },
                            callback: async function (submit_response) {
                                if (submit_response.message) {
                                    frappe.msgprint(__('Stock Entry submitted successfully: ' + submit_response.message.name));

                                    try {
                                        await get_submited_st_entry(frm, submit_response.message.name);
                                        resolve(true);  // Resolve when everything is successful
                                    } catch (error) {
                                        reject(false);  // Reject if there is an error in submission
                                    }
                                } else {
                                    frappe.msgprint(__('Failed to submit the Stock Entry.'));
                                    reject(false);  // Reject when submission fails
                                }
                            }
                        });
                    } else {
                        frappe.msgprint(__('Failed to create Stock Entry.'));
                        reject(false);  // Reject when creation fails
                    }
                }
            });

            // if (series_map[company]) {
            //     frm.set_value("naming_series", series_map[company]);         
            //     frm.set_value("company", company);   
            // }
        });


        // let company = frappe.defaults.get_user_default("Company");
        // console.log("User's Company:", company);


        // if (!company) {
        //     frappe.msgprint(__('Company Not Set For You, set company for this user!'));
        // }



    });
}


function get_submited_st_entry(frm, name) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "get_submited_stock_entry",
            args: {
                stock_name: name
            },
            callback: function (get_response) {
                if (get_response.message && Array.isArray(get_response.message)) {
                    console.log("Response message:", get_response.message);

                    // Iterate through each line item in the form
                    frm.doc.items.forEach(function (row) {
                        console.log("Processing line item:", row.item, row.qty);

                        get_response.message.forEach(function (st_entry_item) {
                            if (
                                st_entry_item.item_code === row.item &&
                                (st_entry_item.qty == row.qty || row.rejected_qty)
                            ) {
                                calculation_part(row, st_entry_item.transfer_qty, name, st_entry_item.t_warehouse);

                            }
                        });
                    });
                    add_supplier_dc(frm);
                    status_validation(frm);
                    frm.refresh_field("items");
                    if (frm.doc.dc_status == "Completed") {
                        frappe.call({
                            method: "frappe.client.submit",
                            args: {
                                doc: frm.doc
                            },
                            callback: function (submit_response) {
                                if (submit_response.message) {
                                    frappe.msgprint(__('Submitted Successfully'));
                                    frm.reload_doc();
                                    resolve(true);  // Resolve when submission is successful
                                } else {
                                    frappe.msgprint(__('Failed to submit'));
                                    reject(false);  // Reject when submission fails
                                }
                            }
                        });
                    } else {
                        resolve(true);  // Resolve even if status is not "Completed"
                    }
                } else {
                    frappe.msgprint(__('Failed to fetch Stock Entry details: ' + JSON.stringify(get_response.message)));
                    reject(false);  // Reject when fetching fails
                }
            }
        });
    });
}


function calculation_part(row_item, transfer_qty, new_stock_tr_id, stock_entred_warehouse) {
    let totalQty = parseFloat(row_item.total_qty) || 0;
    let balanceQty = parseFloat(row_item.balance_qty) || 0;
    let givenQty = parseFloat(transfer_qty) || 0;

    let new_balance = balanceQty - givenQty;

    // if (new_balance <= totalQty) {

    // new_balance = balanceQty - givenQty;
    new_given = "0";
    new_rej_qty = "0";
    let existing_ids = row_item.stock_transfer_id || "";
    if (existing_ids) {
        let ids = existing_ids.split(",").map(id => id.trim());
        if (!ids.includes(`${new_stock_tr_id}-${givenQty}`)) {
            ids.push(`${new_stock_tr_id}-${givenQty}`);
            existing_ids = ids.join(", ");
        }
    } else {
        existing_ids = `${new_stock_tr_id}-${givenQty}`
    }

    console.log("warehouse", stock_entred_warehouse);

    if (stock_entred_warehouse == "Rejected Items - MVDF") {
        console.log("invoked to rj qty");
        console.log("row_item", row_item);
        let rejected = givenQty + (parseFloat(row_item.total_rejected) || 0);
        console.log("total_rj_qty", rejected);
        frappe.model.set_value(row_item.doctype, row_item.name, "total_rejected", rejected);
        frappe.model.set_value(row_item.doctype, row_item.name, "rejected_qty", new_rej_qty);
    } else {
        let accepeted_qty = givenQty + (parseFloat(row_item.total_accepted_qty) || 0);
        frappe.model.set_value(row_item.doctype, row_item.name, "total_accepted_qty", accepeted_qty);
    }

    frappe.model.set_value(row_item.doctype, row_item.name, "balance_qty", new_balance);
    frappe.model.set_value(row_item.doctype, row_item.name, "qty", new_given);
    frappe.model.set_value(row_item.doctype, row_item.name, "stock_transfer_id", existing_ids);
    // } else {
    // frappe.msgprint(__('Item Code ' + row_item.item_code + ' exceeds the quantity. Given: ' + givenQty + ', Balance: ' + balanceQty + ', Total: ' + totalQty));
    // allValid = false;
    // }
}


function add_supplier_dc(frm) {
    let givenDc = frm.doc.supplier_dc || "";
    let supplier_dc_ids = frm.doc.supplier_dc_ids || "";

    if (givenDc) {  // Ensure givenDc is not empty
        if (supplier_dc_ids) {
            let ids = supplier_dc_ids.split(",").map(id => id.trim());
            if (!ids.includes(givenDc)) {
                ids.push(givenDc);
                supplier_dc_ids = ids.join(", ");
            }
        } else {
            supplier_dc_ids = givenDc;
        }
        frm.set_value("supplier_dc_ids", supplier_dc_ids);  // Update the form field
        frm.refresh_field("supplier_dc_ids");  // Refresh the field to reflect the update
    }
}