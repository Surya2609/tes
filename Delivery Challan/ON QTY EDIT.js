// frappe.ui.form.on('DC Table', {
//     qty: function (frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
//         let current_qty = row.qty;
//         let ref_ids = [];  // Array to store formatted reference IDs
//         if (row.item && current_qty) {
//             if (frm.doc.items_from == "Purchase Receipt" && frm.doc.dc_type == "OUT") {
//                 pr_item(row, current_qty, ref_ids, cdt, cdn);
//             } else if (frm.doc.items_from == "Work Order" && frm.doc.dc_type == "OUT") {
//                 only_for_wo(row, current_qty, ref_ids, cdt, cdn);
//             } else if (frm.doc.items_from == "IN") {



//             }
//         }
//     }
// });

// function findCorrentQty(item) {
//     return new Promise((resolve, reject) => {
//         console.log("itm", item);
//         frappe.call({
//             method: 'get_uoms',
//             args: { item: item },
//             callback: function (r) {
//                 if (r.message) {
//                     console.log("Fetched Data:", r.message);
//                     resolve(r.message);
//                 } else {
//                     reject(new Error("No data received from server"));
//                 }
//             },
//             error: function (err) {
//                 reject(err);
//             }
//         });
//     });
// }

// function only_for_wo(row, current_qty, ref_ids, cdt, cdn) {
//     console.log("current_qty", current_qty);
//     frappe.call({
//         method: 'get_wo_pending_with_wo_item',
//         args: {
//             item: row.item
//         },
//         callback: function (r) {
//             if (r.message) {
//                 let datas = r.message;
//                 console.log("--", datas);

//                 if (datas.length === 0) {
//                     frappe.msgprint("No Stock For this Item In Work Order");
//                     return;
//                 }
//                 console.log("test2", row);
//                 // Call findCorrentQty() and wait for its result
//                 findCorrentQty(row.item)
//                     .then(data => {
//                         console.log("Received UOM Data:", data);

//                         let value = calculationUOM(row.qty, row.uom, datas[0].uom, datas[0].total_remaining_qty, data);
//                         console.log("vbal", value);
//                         let updated_qty = value.taken; // Store in a new variable

//                         // Now perform validation inside the async block
//                         if (parseFloat(updated_qty) > parseFloat(datas[0].total_remaining_qty)) {
//                             frappe.msgprint("Quantity Exceed For this item in Work Order");
//                             frappe.model.set_value(cdt, cdn, "reference_id", "");
//                             return;
//                         }

//                         // Process the reference IDs
//                         datas.forEach(data => {
//                             if (parseFloat(updated_qty) >= parseFloat(data.remaining_qty)) {
//                                 console.log("invok1", updated_qty);
//                                 console.log("invok1", data.remaining_qty);
//                                 ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
//                                 updated_qty -= data.remaining_qty;
//                                 // update_dc_stocks(data.reference_id, 0);
//                             } else if (parseFloat(updated_qty) === 0) {
//                                 return;
//                             } else {
//                                 console.log("invok2", updated_qty);
//                                 ref_ids.push(`${data.reference_id}(${updated_qty})`);
//                                 updated_qty = 0;
//                                 // update_dc_stocks(data.reference_id, balance_qty);
//                             }
//                         });

//                         // Set the concatenated reference_id string in the child table row
//                         frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
//                     })
//                     .catch(error => {
//                         console.error("Error fetching UOM data:", error);
//                     });
//             }
//         }
//     });
// }


// // function only_for_wo(row, current_qty, ref_ids, cdt, cdn) {
// // console.log("current_qty", current_qty);
// //     frappe.call({
// //         method: 'get_wo_pending_with_wo_item',
// //         args: {
// //             item: row.item
// //         },
// //         callback: function (r) {
// //             if (r.message) {
// //                 let datas = r.message;
// //                 console.log("--", datas);

// //                 if (datas.length == 0) {
// //                     frappe.msgprint("No Stock For this Item In Work Order");
// //                     return;
// //                 }
// //                 console.log("test2", row);

// //                 findCorrentQty({ row: row.item })
// //                     .then(data => {
// //                         console.log("Received UOM Data:", data);
// //                         let value = calculationUOM(row.qty, row.uom, datas[0].uom, datas[0].total_remaining_qty, data);
// //                         console.log("vbal", value);
// //                         current_qty = value.taken;
// //                     })
// //                     .catch(error => {
// //                         console.error("Error fetching UOM data:", error);
// //                     });


// //                 if (parseFloat(current_qty) > parseFloat(datas[0].total_remaining_qty)) {
// //                     frappe.msgprint("Quantity Exceed For this item in Work Order");
// //                     frappe.model.set_value(cdt, cdn, "reference_id", "");
// //                     return;
// //                 }

// //                 datas.forEach(data => {
// //                     if (parseFloat(current_qty) >= parseFloat(data.remaining_qty)) {
// //                         console.log("invok1", current_qty);
// //                         console.log("invok1", data.remaining_qty);
// //                         ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
// //                         current_qty -= data.remaining_qty;
// //                         // update_dc_stocks(data.reference_id, 0);
// //                     } else if (parseFloat(current_qty) == 0) {
// //                         return;
// //                     } else {
// //                         console.log("invok2", current_qty);
// //                         ref_ids.push(`${data.reference_id}(${current_qty})`);
// //                         // let balance_qty = data.remaining_qty - current_qty;
// //                         current_qty = 0;
// //                         // update_dc_stocks(data.reference_id, balance_qty);
// //                     }
// //                 });

// //                 // Set the concatenated reference_id string in the child table row
// //                 frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
// //             }
// //         }
// //     });
// // }


// function calculationUOM(userQty, userUom, stockUom, stockQty, values) {
//     userQty = parseInt(userQty);
//     stockQty = parseInt(stockQty);
//     console.log(values);
//     if (!userUom || !userQty) return { error: "UOM or Qty is missing" };

//     let taken = 0;
//     let remainingStock = stockQty;

//     // Find the conversion factor for the given userUom
//     let conversionEntry = values.find(entry => entry.uom === userUom);
//     let conversionFactor = conversionEntry ? conversionEntry.conversion_factor : null;
//     console.log("stockUom", stockUom);
//     console.log("userUom", userUom);
//     if (stockUom !== userUom) {
//         if (stockUom === "Nos" && userUom === "Kg") {
//             console.log("Invoked: Nos → Kg conversion");
//             if (!conversionFactor) return { error: `Conversion factor not found for ${userUom}` };
//             taken = userQty * conversionFactor;
//         }
//         else if (stockUom === "Kg" && userUom === "Nos") {
//             console.log("Invoked: Kg → Nos conversion");
//             console.log("Invoked: Kg → Nos conversion", conversionFactor);
//             if (!conversionFactor) return { error: `Conversion factor not found for ${userUom}` };
//             taken = userQty / conversionFactor;
//         }
//         else {
//             return { error: `No valid conversion found for ${userUom} from ${stockUom}` };
//         }
//     } else {
//         taken = userQty;
//     }

//     remainingStock = stockQty - taken;

//     return { taken, remainingStock };
// }

// function calculateUomConversion(userQty, userUom, stockUom, stockQty, conversions) {
//     if (!userUom || !userQty) return { error: "UOM or Qty is missing" };

//     let nosTaken = 0;
//     let remainingStock = stockQty;

//     // Forward Conversion (e.g., stock UOM → kg, stock UOM → gram, stock UOM → ton)
//     if (userUom in conversions) {
//         console.log("invoked");
//         let conversionFactor = conversions[userUom];
//         nosTaken = userQty / conversionFactor;
//     }
//     // Reverse Conversion (e.g., kg → stock UOM, gram → stock UOM, ton → stock UOM)
//     else if ((userUom + "_reverse") in conversions) {
//         let conversionFactor = conversions[userUom + "_reverse"];
//         nosTaken = userQty * conversionFactor;
//     }
//     // Direct match with stock UOM
//     else if (userUom === stockUom) {
//         nosTaken = userQty;
//     }
//     else {
//         return { error: `No conversion found for ${userUom}. Using ${stockUom}` };
//     }

//     // Check stock availability
//     if (nosTaken > stockQty) {
//         return { error: "Not enough stock available!" };
//     }

//     remainingStock = stockQty - nosTaken;
//     console.log("nosTaken", nosTaken);
//     console.log("remainingStock", remainingStock);
//     return { nosTaken, remainingStock };
// }


// function pr_item(row, current_qty, ref_ids, cdt, cdn) {
//     frappe.call({
//         method: 'get_wo_pending_with_pr_item',
//         args: {
//             item: row.item
//         },
//         callback: function (r) {
//             if (r.message) {
//                 let datas = r.message;
//                 console.log("--", datas);
//                 if (datas.length == 0) {
//                     frappe.msgprint("No Stock For this Item In Purchase Receipt");
//                     return;
//                 }
//                 if (parseFloat(current_qty) > parseFloat(datas[0].total_remaining_qty)) {
//                     frappe.msgprint("Quantity Exceed For this item in Purchase Receipt");
//                     frappe.model.set_value(cdt, cdn, "reference_id", "");
//                     return;
//                 }
//                 datas.forEach(data => {
//                     if (parseFloat(current_qty) >= parseFloat(data.remaining_qty)) {
//                         console.log("invok1", current_qty);
//                         console.log("invok1", data.remaining_qty);
//                         ref_ids.push(`${data.reference_id}(${data.remaining_qty})`);
//                         current_qty -= data.remaining_qty;
//                         // update_dc_stocks(data.reference_id, 0);
//                     } else if (parseFloat(current_qty) == 0) {

//                         return;
//                     } else {
//                         console.log("invok2", current_qty);
//                         ref_ids.push(`${data.reference_id}(${current_qty})`);
//                         // let balance_qty = data.remaining_qty - current_qty;
//                         current_qty = 0;
//                         // update_dc_stocks(data.reference_id, balance_qty);
//                     }
//                 });

//                 // Set the concatenated reference_id string in the child table row
//                 frappe.model.set_value(cdt, cdn, "reference_id", ref_ids.join(", "));
//             }
//         }
//     });
// }

// // function update_dc_stocks(ref_id, rem_qty) {
// //     console.log("ref_ids", ref_id);
// //     console.log("rm_qtyy", rem_qty);
// //     frappe.call({
// //         method: "frappe.client.set_value",
// //         args: {
// //             doctype: "Delivery Challan Stocks",
// //             name: ref_id,  // Assuming `ref_id` is the unique identifier (ID) of the document
// //             fieldname: "remaining_qty",
// //             value: rem_qty
// //         },
// //         callback: function (response) {
// //             if (!response.exc) {
// //                 frappe.msgprint("Remaining Quantity updated successfully!");
// //             } else {
// //                 frappe.msgprint("Error updating Remaining Quantity: " + response.exc);
// //             }
// //         }
// //     });
// // }
