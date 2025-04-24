frappe.ui.form.on('Delivery Challan', {
    refresh: function (frm) {
        frm.add_custom_button("ON Save", async function () {
            if (frm.doc.dc_type == "IN") {

                // onDCSaveIn(frm);
                let isExceeded = await validation_dc_in_save(frm);
                console.log("isExceeded", isExceeded);
                if (isExceeded == false) {
                    onDCSaveIn(frm);
                    stock_tranfer_in_with_calculation(frm);                                 
                } else {
                    console.log("invoked");
                    calculate_qty(frm);
                    // create_stock_entry(frm, "out");
                }
            }
        }
        )
    }
});

async function validation_dc_in_save(frm) {
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
                console.log("Fetched Data:", stock_data);

                if (stock_data) {
                    let actualQty = parseFloat(stock_data.dc_out_qty);
                    let gvnQty = parseFloat(referenceMap[refId]);
                    let givenUom = uomMap[refId]; // Get UOM
                    let itemName = itemMap[refId]; // Get Item Name
                    let actualUom = actuatOutUOM[refId]; // Get Actual UOM

                    console.log("Item:", itemName);
                    console.log("actualQty:", actualQty);
                    console.log("gvnQty:", gvnQty);
                    console.log("UOM:", givenUom);
                    console.log("actualUOM:", actualUom);

                    // Wait for findCrtQty to get the conversion data
                    let uomData = await findCrtQty(itemName);
                    console.log("Received UOM Data:", uomData);

                    let value = calculationUOM(gvnQty, givenUom, actualUom, actualQty, uomData);
                    let updated_qty = parseFloat(value.taken); // Store in a new variable
                    console.log("Updated Qty:", updated_qty);

                    // Perform validation
                    if (updated_qty > actualQty) {
                        frappe.msgprint("Quantity Exceed For this item in Work Order");
                        frappe.model.set_value(cdt, cdn, "reference_id", "");
                        validationResult = true; // Set validationResult as `true` when exceeded
                    } else if (validationResult === null) {
                        validationResult = false; // Set only if not already `true`
                    }

                    // ✅ Update actual_taken_in_qty for all matching rows
                    if (validationResult === false) {
                        let targetRows = items.filter(row => row.reference_id === refId);
                        targetRows.forEach(targetRow => {
                            frappe.model.set_value(targetRow.doctype, targetRow.name, "actual_taken_in_qty", updated_qty);
                        });
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            }
        })
    );

    console.log("validationResult", validationResult);
    return validationResult; // Return true (max reached), false (valid), or null (default)
}


function findCrtQty(item) {
    return new Promise((resolve, reject) => {
        console.log("itm", item);
        frappe.call({
            method: 'get_uoms',
            args: { item: item },
            callback: function (r) {
                if (r.message) {
                    console.log("Fetched Data:", r.message);
                    resolve(r.message);
                } else {
                    reject(new Error("No data received from server"));
                }
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}

async function stock_tranfer_in_with_calculation(frm) {
    console.log("on save area");
    let items = frm.doc.items;
    let transferDataArray = []; // Store individual stock transfer entries

    // Process each row separately
    await Promise.all(items.map(async (row) => {
        try {
            let stock_data = await get_current_qty(row.reference_id);
            let actualQty = parseFloat(stock_data.dc_out_qty);
            console.log("Fetched Data:", stock_data);

            // Fetch UOM conversion data
            let uomData = await findCrtQty(row.item);
            console.log("Stock in", uomData);

            // Calculate updated quantity
            let value = uomCalculationDcSave(row.qty, row.uom, row.actual_out_uom, actualQty, uomData);
            let updated_qty = parseFloat(value.taken); // Ensure it's a number
            console.log("Updated Qty:", updated_qty);

            // ✅ Store each row separately in transferDataArray
            transferDataArray.push({
                item_code: row.item,
                s_warehouse : row.source_warehouse,
                t_warehouse : row.target_warehouse,
                qty: updated_qty // Separate updated_qty for each row
            });

        } catch (error) {
            console.error("Error processing row:", error);
        }
    }));

    // ✅ Perform stock transfer for all distinct rows
    console.log("transferDataArray", transferDataArray);
    await transferStock(transferDataArray);
}


async function transferStock(transferDataArray) {
    console.log("Transferring stock:", transferDataArray);
    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: {
                doctype: "Stock Entry",
                stock_entry_type: "Material Transfer",
                from_bom: 0,
                items: transferDataArray
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

    // try {
    //     let response = await frappe.call({
    //         method: "erpnext.stock.doctype.stock_entry.stock_entry.make_stock_transfer",
    //         args: { items: transferDataArray }, // Pass all items separately
    //         callback: function (r) {
    //             if (r.message) {
    //                 console.log("Stock Transfer Successful:", r.message);
    //             }
    //         }
    //     });
    // } catch (error) {
    //     console.error("Stock Transfer Failed:", error);
    // }
}

async function onDCSaveIn(frm) {
    console.log("on save area");
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
                console.log("Fetched Datasdfgsd:", stock_data);
                let dc_ot_qty = 0;

                if (stock_data) {
                    let actualQty = parseInt(stock_data.dc_out_qty);
                    let gvnQty = parseInt(referenceMap[refId]);
                    let givenUom = uomMap[refId]; // Get UOM
                    let itemName = itemMap[refId]; // Get Item Name
                    let actualUom = actuatOutUOM[refId]; // Get Item Name

                    console.log("Item save:", itemName);
                    console.log("actualQty save:", actualQty);
                    console.log("gvnQty save:", gvnQty);
                    console.log("UOM save:", givenUom);
                    console.log("actualUOM save:", actualUom);

                    findCrtQty(itemName)
                        .then(data => {
                            console.log("Received UOM Data save:", data);
                            console.log("going to invoke save");
                            let value = uomCalculationDcSave(gvnQty, givenUom, actualUom, actualQty, data);
                            console.log("vbal", value);
                            let updated_qty = value.taken; // Store in a new variable

                            // let actualQty = parseInt(stock_data.dc_out_qty);

                            // Now perform validation inside the async block
                            // if (parseFloat(updated_qty) > parseFloat(actualQty)) {
                            //     frappe.msgprint("Quantity Exceed For this item in Work Order");
                            //     frappe.model.set_value(cdt, cdn, "reference_id", "");
                            //     return;
                            // }
                            if (actualQty == updated_qty) {
                                dc_ot_qty = 0;
                                let current_dc_in_qty = isNaN(parseFloat(stock_data.dc_in_qty)) || stock_data.dc_in_qty === "--" ? 0 : parseFloat(stock_data.dc_in_qty);
                                let new_dc_in_qty = current_dc_in_qty + updated_qty;
                                update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                            } else if (actualQty > updated_qty) {
                                dc_ot_qty = actualQty - updated_qty;
                                let current_dc_in_qty = isNaN(parseFloat(stock_data.dc_in_qty)) || stock_data.dc_in_qty === "--" ? 0 : parseFloat(stock_data.dc_in_qty);
                                let new_dc_in_qty = current_dc_in_qty + updated_qty;
                                update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
                            }
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

            } catch (error) {
                console.error("Error:", error);
            }
        })
    );
}

// async function onDCSaveIn(frm) {
//     let items = frm.doc.items;
//     let referenceMap = {};

//     // Iterate over line items and sum qty for each reference_id
//     items.forEach(row => {
//         let refId = row.reference_id;
//         if (refId) {
//             if (!referenceMap[refId]) {
//                 referenceMap[refId] = 0;
//             }
//             referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
//         }
//     });

//     console.log("Total qty for each reference_id:");

//     // Validate each reference_id asynchronously
//     await Promise.all(
//         Object.keys(referenceMap).map(async (refId) => {
//             try {
//                 let data = await get_current_qty(refId);
//                 console.log("Fetched Data:", data);
//                 let dc_ot_qty = 0;
//                 if (data) {
//                     let actualQty = parseInt(data.dc_out_qty);
//                     let gvnQty = parseInt(referenceMap[refId]);
//                     if (actualQty == gvnQty) {
//                         dc_ot_qty = 0;
//                         let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
//                         let new_dc_in_qty = current_dc_in_qty + gvnQty;
//                         update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
//                     } else if (actualQty > gvnQty) {
//                         dc_ot_qty = actualQty - gvnQty;
//                         let current_dc_in_qty = isNaN(parseFloat(data.dc_in_qty)) || data.dc_in_qty === "--" ? 0 : parseFloat(data.dc_in_qty);
//                         let new_dc_in_qty = current_dc_in_qty + gvnQty;
//                         update_dc_stock_for_in(refId, dc_ot_qty, new_dc_in_qty);
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error:", error);
//             }
//         })
//     );
// }

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

function uomCalculationDcSave(userQty, userUom, stockUom, stockQty, values) {
    console.log("entry");
    userQty = parseInt(userQty);
    stockQty = parseInt(stockQty);
    console.log(values);
    if (!userUom || !userQty) return { error: "UOM or Qty is missing" };

    let taken = 0;
    let remainingStock = stockQty;

    // Find the conversion factor for the given userUom
    let conversionEntry = values.find(entry => entry.uom === userUom);
    console.log("conversionEntry", conversionEntry);
    let conversionFactor = conversionEntry ? conversionEntry.conversion_factor : null;

    console.log("stockUom", stockUom);
    console.log("userUom", userUom);
    if (stockUom !== userUom) {
        if (stockUom === "Nos" && userUom === "Kg") {
            console.log("Invoked: Nos → Kg conversion");
            if (!conversionFactor) return { error: `Conversion factor not found for ${userUom}` };
            taken = userQty * conversionFactor;
        }
        else if (stockUom === "Kg" && userUom === "Nos") {
            console.log("Invoked: Kg → Nos conversion");
            console.log("Invoked: Kg → Nos conversion", conversionFactor);
            if (!conversionFactor) return { error: `Conversion factor not found for ${userUom}` };
            taken = userQty / conversionFactor;
        }
        else {
            return { error: `No valid conversion found for ${userUom} from ${stockUom}` };
        }
    } else {
        taken = userQty;
    }

    remainingStock = stockQty - taken;

    return { taken, remainingStock };
}


function calculate_qty(frm) {

    if (frm.doc.items && frm.doc.items.length > 0) {
        console.log("inv2");
        frm.doc.items.forEach(item => {
            let stock_uom = item.uom;
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
                                    // uom = frm.doc.uom;
                                    let rm_qty = data.remaining_qty - extractedValue;
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

function default_uom(item) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "get_default_uom",
            args: { item: item },
            callback: function (response) {
                if (response && response.message) {
                    resolve(response.message);
                } else {
                    reject("No UOM found");
                }
            }
        });
    });
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



// async function validation_dc_in_save(frm) {
//     let items = frm.doc.items;
//     let referenceMap = {};
//     let validationResult = null; // Default null

//     // Iterate over line items and sum qty for each reference_id
//     items.forEach(row => {
//         let refId = row.reference_id;
//         if (refId) {
//             if (!referenceMap[refId]) {
//                 referenceMap[refId] = 0;
//             }
//             referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
//         }
//     });

//     console.log("Total qty for each reference_id:");

//     // Validate each reference_id asynchronously
//     await Promise.all(
//         Object.keys(referenceMap).map(async (refId) => {
//             try {
//                 let data = await get_current_qty(refId);
//                 console.log("Fetched Data:", data);

//                 if (data) {
//                     let actualQty = parseInt(data.dc_out_qty);
//                     let gvnQty = parseInt(referenceMap[refId]);

//                     if (actualQty < gvnQty) {
//                         frappe.msgprint(__(`Cannot save DC OUT Qty for this ${refId}. Maximum allowed qty is ${data.dc_out_qty}.`));
//                         validationResult = true; // Max reached
//                     } else if (validationResult === null) {
//                         validationResult = false; // Not max, but set only if not already true
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error:", error);
//             }
//         })
//     );

//     return validationResult; // Return null (default), true (max reached), or false (valid)
// }