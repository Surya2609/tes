frappe.ui.form.on('DC Table', {
    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let current_qty = row.qty;
        let ref_ids = [];  // Array to store formatted reference IDs
        if (row.item && current_qty) {
            if (frm.doc.items_from == "Purchase Receipt" && frm.doc.dc_type == "OUT") {
                pr_item(row, current_qty, ref_ids, cdt, cdn);
            } else if (frm.doc.items_from == "Work Order" && frm.doc.dc_type == "OUT") {
                only_for_wo(row, current_qty, ref_ids, cdt, cdn);
            }
        }
    }
});

function only_for_wo(row, current_qty, ref_ids, cdt, cdn) {
    frappe.call({
        method: 'get_wo_pending_with_wo_item',
        args: {
            item: row.item
        },
        callback: function (r) {
            if (r.message) {
                let datas = r.message;
                console.log("--", datas);
                if (datas.length == 0) {
                    frappe.msgprint("No Stock For this Item In Work Order");
                    return;
                }

                if (parseFloat(current_qty) > parseFloat(datas[0].total_remaining_qty)) {
                    frappe.msgprint("Quantity Exceed For this item in Work Order");
                    frappe.model.set_value(cdt, cdn, "reference_id", "");
                    return;
                }
                datas.forEach(data => {
                    if (parseFloat(current_qty) >= parseFloat(data.remaining_qty)) {
                        console.log("invok1", current_qty);
                        console.log("invok1", data.remaining_qty);
                        ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
                        current_qty -= data.remaining_qty;
                        // update_dc_stocks(data.reference_id, 0);
                    } else if (parseFloat(current_qty) == 0) {

                        return;
                    } else {
                        console.log("invok2", current_qty);
                        ref_ids.push(`${data.reference_id}(${current_qty})`);
                        // let balance_qty = data.remaining_qty - current_qty;
                        current_qty = 0;
                        // update_dc_stocks(data.reference_id, balance_qty);
                    }
                });

                // Set the concatenated reference_id string in the child table row
                frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
            }
        }
    });
}


function pr_item(row, current_qty, ref_ids, cdt, cdn) {
    frappe.call({
        method: 'get_wo_pending_with_pr_item',
        args: {
            item: row.item
        },
        callback: function (r) {
            if (r.message) {
                let datas = r.message;
                console.log("--", datas);
                if (datas.length == 0) {
                    frappe.msgprint("No Stock For this Item In Purchase Receipt");
                    return;
                }
                if (parseFloat(current_qty) > parseFloat(datas[0].total_remaining_qty)) {
                    frappe.msgprint("Quantity Exceed For this item in Purchase Receipt");
                    frappe.model.set_value(cdt, cdn, "reference_id", "");
                    return;
                }
                datas.forEach(data => {
                    if (parseFloat(current_qty) >= parseFloat(data.remaining_qty)) {
                        console.log("invok1", current_qty);
                        console.log("invok1", data.remaining_qty);
                        ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
                        current_qty -= data.remaining_qty;
                        // update_dc_stocks(data.reference_id, 0);
                    } else if (parseFloat(current_qty) == 0) {

                        return;
                    } else {
                        console.log("invok2", current_qty);
                        ref_ids.push(`${data.reference_id}(${current_qty})`);
                        // let balance_qty = data.remaining_qty - current_qty;
                        current_qty = 0;
                        // update_dc_stocks(data.reference_id, balance_qty);
                    }
                });

                // Set the concatenated reference_id string in the child table row
                frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
            }
        }
    });
}

// function update_dc_stocks(ref_id, rem_qty) {
//     console.log("ref_ids", ref_id);
//     console.log("rm_qtyy", rem_qty);
//     frappe.call({
//         method: "frappe.client.set_value",
//         args: {
//             doctype: "Delivery Challan Stocks",
//             name: ref_id,  // Assuming `ref_id` is the unique identifier (ID) of the document
//             fieldname: "remaining_qty",
//             value: rem_qty
//         },
//         callback: function (response) {
//             if (!response.exc) {
//                 frappe.msgprint("Remaining Quantity updated successfully!");
//             } else {
//                 frappe.msgprint("Error updating Remaining Quantity: " + response.exc);
//             }
//         }
//     });
// }


frappe.ui.form.on('Delivery Challan', {
    refresh: function (frm) {
        frm.add_custom_button("ON Save", async function () {
            if (frm.doc.dc_type == "IN") {
                let isExceeded = await validation_dc_in_save(frm);
                if (isExceeded == false) {
                    create_stock_entry(frm, "in");
                }
            } else {
                console.log("invoked");
                create_stock_entry(frm, "out");

            }
        })
    }
});

async function validation_dc_in_save(frm) {
    let items = frm.doc.items;
    let referenceMap = {};
    let validationResult = null; // Default null

    // Iterate over line items and sum qty for each reference_id
    items.forEach(row => {
        let refId = row.reference_id;
        if (refId) {
            if (!referenceMap[refId]) {
                referenceMap[refId] = 0;
            }
            referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
        }
    });

    console.log("Total qty for each reference_id:");

    // Validate each reference_id asynchronously
    await Promise.all(
        Object.keys(referenceMap).map(async (refId) => {
            try {
                let data = await get_current_qty(refId);
                console.log("Fetched Data:", data);

                if (data) {
                    let actualQty = parseInt(data.dc_out_qty);
                    let gvnQty = parseInt(referenceMap[refId]);

                    if (actualQty < gvnQty) {
                        frappe.msgprint(__(`Cannot save DC OUT Qty for this ${refId}. Maximum allowed qty is ${data.dc_out_qty}.`));
                        validationResult = true; // Max reached
                    } else if (validationResult === null) {
                        validationResult = false; // Not max, but set only if not already true
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            }
        })
    );

    return validationResult; // Return null (default), true (max reached), or false (valid)
}


async function onDCSaveIn(frm) {
    let items = frm.doc.items;
    let referenceMap = {};

    // Iterate over line items and sum qty for each reference_id
    items.forEach(row => {
        let refId = row.reference_id;
        if (refId) {
            if (!referenceMap[refId]) {
                referenceMap[refId] = 0;
            }
            referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
        }
    });

    console.log("Total qty for each reference_id:");

    // Validate each reference_id asynchronously
    await Promise.all(
        Object.keys(referenceMap).map(async (refId) => {
            try {
                let data = await get_current_qty(refId);
                console.log("Fetched Data:", data);
                let dc_ot_qty = 0;
                if (data) {
                    let actualQty = parseInt(data.dc_out_qty);
                    let gvnQty = parseInt(referenceMap[refId]);
                    if (actualQty == gvnQty) {
                        dc_ot_qty = 0;
                        let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
                        let new_dc_in_qty = current_dc_in_qty + gvnQty;
                        update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                    } else if (actualQty > gvnQty) {
                        dc_ot_qty = actualQty - gvnQty;
                        let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
                        let new_dc_in_qty = current_dc_in_qty + gvnQty;
                        update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            }
        })
    );
}

function update_dc_stock_for_in(ref_id, dc_out_qty, dc_in_qty) {
    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Delivery Challan Stocks",
            name: ref_id,  // Unique identifier of the document
            fieldname: {
                "dc_out_qty": dc_out_qty,
                "dc_in_qty": dc_in_qty
            }
        },
        callback: function (response) {
            if (!response.exc) {
                frappe.msgprint("Remaining Quantity & DC Out Quantity updated successfully!");

            } else {
                frappe.msgprint("Error updating fields: " + response.exc);
            }
        }
    });
}




function calculate_qty(frm) {
    if (frm.doc.items && frm.doc.items.length > 0) {
        frm.doc.items.forEach(item => {
            console.log("Fetched row:", item);
            let ref_ids = item.reference_id ? item.reference_id.split(', ') : [];
            if (ref_ids.length > 0) {

                ref_ids.forEach(ref_id => {
                    console.log("Original ref_id:", ref_id);
                    // Use regex to extract the reference ID and quantity inside parentheses
                    let match = ref_id.match(/^(.+)\((\d+)\)$/);

                    if (match) {
                        let extractedRefId = match[1]; // Extracted reference ID
                        let extractedValue = parseInt(match[2], 10); // Extracted quantity as an integer

                        console.log("Extracted ref_id:", extractedRefId);
                        console.log("Extracted value:", extractedValue);


                        get_current_qty(extractedRefId)
                            .then((data) => {
                                console.log("Fetched Data:", data);
                                if (data) {
                                    let rm_qty = data.remaining_qty - extractedValue;

                                    // Convert `data.dc_out_qty` to a number, treating "--" as 0
                                    let current_dc_out_qty = isNaN(parseFloat(data.dc_out_qty)) || data.dc_out_qty === "--" ? 0 : parseFloat(data.dc_out_qty);

                                    let new_dc_out_qty = current_dc_out_qty + extractedValue;
                                    console.log("Updated Remaining Qty:", rm_qty);
                                    console.log("Updated DC Out Qty:", new_dc_out_qty);
                                    update_dc_stock(extractedRefId, rm_qty, new_dc_out_qty);
                                }
                            })
                            .catch((error) => {
                                console.error("Error:", error);
                            });

                        // get_current_qty(extractedRefId)
                        //     .then((data) => {
                        //         console.log("Fetched Data:", data);
                        //         if (data) {
                        //             let rm_qty = 0;
                        //             rm_qty = data.remaining_qty - extractedValue;
                        //             current_dc_out_qty = data.dc_out_qty 
                        //             console.log("askjndfka", rm_qty);
                        //             update_dc_stock(extractedRefId, rm_qty, extractedValue);
                        //         }
                        //     })
                        //     .catch((error) => {
                        //         console.error("Error:", error);
                        //     });
                    } else {
                        console.log("Invalid format:", ref_id);
                    }
                });
            }
        });
    }
}

function update_dc_stock(ref_id, rem_qty, extractedValue) {
    console.log("ref_ids", ref_id);
    console.log("rm_qtyy", rem_qty);
    console.log("extracted qty", extractedValue);

    frappe.call({
        method: "frappe.client.set_value",
        args: {
            doctype: "Delivery Challan Stocks",
            name: ref_id,  // Unique identifier of the document
            fieldname: {
                "remaining_qty": rem_qty,
                "dc_out_qty": extractedValue
            }
        },
        callback: function (response) {
            if (!response.exc) {
                frappe.msgprint("Remaining Quantity & DC Out Quantity updated successfully!");
            } else {
                frappe.msgprint("Error updating fields: " + response.exc);
            }
        }
    });
}

function get_current_qty(reference_id) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Delivery Challan Stocks",
                filters: {
                    name: reference_id
                }
            },
            callback: function (response) {
                if (response.message) {
                    console.log(response.message);
                    resolve(response.message);  // Return data when successful
                } else {
                    frappe.msgprint(__('No Records Found'));
                    reject('No Records Found');  // Handle empty response
                }
            },
            error: function (error) {
                reject(error);  // Handle API errors
            }
        });
    });
}

function create_stock_entry(frm, type) {
    let items = [];
    frm.doc.items.forEach(item => {
        items.push({
            item_code: item.item,  // Item from the Delivery Challan
            qty: item.qty,  // Quantity
            s_warehouse: item.source_warehouse,  // Source warehouse
            t_warehouse: item.target_warehouse  // Target warehouse
        });
    });

    if (items.length === 0) {
        frappe.msgprint(__('No items to transfer.'));
        return;
    }

    // if(items.target_warehouse == null && items.source_warehouse == null){
    //     frappe.msgprint(__('Not Set Target Warehouse or Source Warehouse'));
    //     return;
    // }

    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: {
                doctype: "Stock Entry",
                stock_entry_type: "Material Transfer",
                from_bom: 0,
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
                            if (type == "in") {
                                onDCSaveIn(frm);
                            } else {
                                calculate_qty(frm);
                            }
                            frappe.msgprint(__('Stock Entry {0} submitted successfully.', [response.message.name]));
                        } else {
                            frappe.msgprint(__('Failed to submit the Stock Entry.'));
                        }
                    }
                });
            } else {
                frappe.msgprint(__('Failed to create Stock Entry.'));
            }
        }
    });
}


async function onDCSaveIn(frm) {
    let items = frm.doc.items;
    let referenceMap = {};
    let actuatOutUOM = {};
    let uomMap = {}; // Store UOM for each reference_id
    let itemMap = {}; // Store Item Name for each reference_id
    let validationResult = null; // Default null

    // Iterate over line items and sum qty for each reference_id
    items.forEach(row => {
        let refId = row.reference_id;
        if (refId) {
            if (!referenceMap[refId]) {
                referenceMap[refId] = 0;
                uomMap[refId] = row.uom; // Store UOM
                itemMap[refId] = row.item; // Store Item Name
                actuatOutUOM[refId] = row.actual_out_uom;
            }
            referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
        }
    });


    console.log("Total qty for each reference_id:");

    // Validate each reference_id asynchronously
    await Promise.all(
        Object.keys(referenceMap).map(async (refId) => {
            try {
                let stock_data = await get_current_qty(refId);
                console.log("Fetched Data:", data);
                let dc_ot_qty = 0;

                if (stock_data) {
                    let actualQty = parseInt(stock_data.dc_out_qty);
                    let gvnQty = parseInt(referenceMap[refId]);
                    let givenUom = uomMap[refId]; // Get UOM
                    let itemName = itemMap[refId]; // Get Item Name
                    let actualUom = actuatOutUOM[refId]; // Get Item Name

                    console.log("Item:", itemName);
                    console.log("actualQty:", actualQty);
                    console.log("gvnQty:", gvnQty);
                    console.log("UOM:", givenUom);
                    console.log("actualUOM:", actualUom);

                    findCrtQty(itemName)
                        .then(data => {
                            console.log("Received UOM Data:", data);

                            let value = calculationUOM(gvnQty, givenUom, actualUom, actualQty, data);
                            console.log("vbal", value);
                            let updated_qty = value.taken; // Store in a new variable

                            let actualQty = parseInt(stock_data.dc_out_qty);
                            let gvnQty = updated_qty;


                            // Now perform validation inside the async block
                            if (parseFloat(updated_qty) > parseFloat(actualQty)) {
                                frappe.msgprint("Quantity Exceed For this item in Work Order");
                                frappe.model.set_value(cdt, cdn, "reference_id", "");
                                return;
                            }

                            if (actualQty == gvnQty) {
                                dc_ot_qty = 0;
                                let current_dc_in_qty = isNaN(parseFloat(stock_data.dc_in_qty)) || stock_data.dc_in_qty === "--" ? 0 : parseFloat(stock_data.dc_in_qty);
                                let new_dc_in_qty = current_dc_in_qty + gvnQty;
                                update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                            } else if (actualQty > gvnQty) {
                                dc_ot_qty = actualQty - gvnQty;
                                let current_dc_in_qty = isNaN(parseFloat(stock_data.dc_in_qty)) || stock_data.dc_in_qty === "--" ? 0 : parseFloat(stock_data.dc_in_qty);
                                let new_dc_in_qty = current_dc_in_qty + gvnQty;
                                update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                            }




                            // // Process the reference IDs
                            // datas.forEach(data => {
                            //     if (parseFloat(updated_qty) >= parseFloat(data.remaining_qty)) {
                            //         console.log("invok1", updated_qty);
                            //         console.log("invok1", data.remaining_qty);
                            //         ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
                            //         updated_qty -= data.remaining_qty;
                            //         // update_dc_stocks(data.reference_id, 0);
                            //     } else if (parseFloat(updated_qty) === 0) {
                            //         return;
                            //     } else {
                            //         console.log("invok2", updated_qty);
                            //         ref_ids.push(`${data.reference_id}(${updated_qty})`);
                            //         updated_qty = 0;
                            //         // update_dc_stocks(data.reference_id, balance_qty);
                            //     }
                            // });
                            // // Set the concatenated reference_id string in the child table row
                            // frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
                        })
                        .catch(error => {
                            console.error("Error fetching UOM data:", error);
                        });

                    if (actualQty < updated_qty) {
                        frappe.msgprint(__(`Cannot save DC OUT Qty for item '${itemName}' (${refId}). Maximum allowed qty is ${stock_data.dc_out_qty} ${uom}.`));
                        validationResult = true; // Max reached
                    } else if (validationResult === null) {
                        validationResult = false; // Not max, but set only if not already true
                    }
                }


                // if (data) {
                //     let actualQty = parseInt(data.dc_out_qty);
                //     let gvnQty = parseInt(referenceMap[refId]);
                //     if (actualQty == gvnQty) {
                //         dc_ot_qty = 0;
                //         let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
                //         let new_dc_in_qty = current_dc_in_qty + gvnQty;
                //         update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                //     } else if (actualQty > gvnQty) {
                //         dc_ot_qty = actualQty - gvnQty;
                //         let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
                //         let new_dc_in_qty = current_dc_in_qty + gvnQty;
                //         update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                //     }
                // }
            } catch (error) {
                console.error("Error:", error);
            }
        })
    );
}