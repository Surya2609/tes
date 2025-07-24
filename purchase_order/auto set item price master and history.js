// frappe.ui.form.on('Purchase Order', {
//     before_save: function (frm) {
//         if (!frm.doc.supplier) return;
//         frm.doc.items.forEach(item => {
//             console.log("item", item);
//             if (item.rate > 0) {
//                 console.log("b pricelist", frm.doc.buying_price_list);
//                 frappe.call({
//                     method: "frappe.client.get_value",
//                     args: {
//                         doctype: "Item Price",
//                         filters: {
//                             item_code: item.item_code,
//                             supplier: frm.doc.supplier,
//                             price_list: frm.doc.buying_price_list
//                         },
//                         fieldname: ["name", "price_list_rate"]
//                     },
//                     callback: function (res) {
//                         const price = res.message || {};
//                         if (isEmptyObject(price)) {
//                             frappe.call({
//                                 method: "frappe.client.insert",
//                                 args: {
//                                     doc: {
//                                         doctype: "Item Price",
//                                         item_code: item.item_code,
//                                         supplier: frm.doc.supplier,
//                                         price_list: frm.doc.buying_price_list,
//                                         price_list_rate: item.custom_unit_rate,
//                                         buying: 1
//                                     }
//                                 }
//                             });
//                             updateHistory(frm, item, 0);
//                         } else {                            
//                             console.log("Found existing price:", price.name);
//                             let lastPrice = parseFloat(price.price_list_rate);
//                             if (lastPrice !== parseFloat(item.custom_unit_rate)) {
//                                 frappe.call({
//                                     method: "frappe.client.set_value",
//                                     args: {
//                                         doctype: "Item Price",
//                                         name: price.name,
//                                         fieldname: {
//                                             price_list_rate: item.custom_unit_rate
//                                         }
//                                     }
//                                 });
//                                 updateHistory(frm, item, lastPrice);
//                             }
//                         }

//                         // console.log("pr", price);
//                         // console.log("true or flase", JSON.stringify(price));
//                         // if (JSON.stringify(price) === '{}') {
//                         //     let lastPrice = parseFloat(price.price_list_rate);
//                         //     if (lastPrice !== parseFloat(item.rate)) {
//                         //         frappe.call({
//                         //             method: "frappe.client.set_value",
//                         //             args: {
//                         //                 doctype: "Item Price",
//                         //                 name: price.name,
//                         //                 fieldname: {
//                         //                     price_list_rate: item.rate
//                         //                 }
//                         //             }
//                         //         });
//                         //         updateHistory(frm, item, lastPrice);
//                         //     }
//                         // } else {
//                         //     frappe.call({
//                         //         method: "frappe.client.insert",
//                         //         args: {
//                         //             doc: {
//                         //                 doctype: "Item Price",
//                         //                 item_code: item.item_code,
//                         //                 supplier: frm.doc.supplier,
//                         //                 price_list: frm.doc.selling_price_list,
//                         //                 price_list_rate: item.rate,
//                         //                 buying: 1
//                         //             }
//                         //         }
//                         //     });
//                         //     updateHistory(frm, item, 0);
//                         // }


//                     }
//                 });
//             }
//         });
//     }
// });

// function updateHistory(frm, item, lastRate) {
//     frappe.call({
//         method: "frappe.client.insert",
//         args: {
//             doc: {
//                 doctype: "Price Change History",
//                 item: item.item_code,
//                 user: frappe.session.user,
//                 supplier: frm.doc.supplier,
//                 rate: item.rate,
//                 last_rate: lastRate,
//                 date_time: frappe.datetime.now_date()
//             }
//         }
//     });
// }


// function isEmptyObject(obj) {
//     return (
//         obj &&
//         typeof obj === 'object' &&
//         !Array.isArray(obj) &&
//         Object.keys(obj).length === 0
//     );
// }
