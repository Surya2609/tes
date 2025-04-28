// frappe.ui.form.on('Delivery Note', {
//     on_submit: function (frm) {
//         let so_list = frm.doc.items
//             .map(item => item.against_sales_order)
//             .filter(so => so); // remove null/empty values

//         let unique_so_list = [...new Set(so_list)];

//         if (unique_so_list.length > 0) {        
//             for (let so_id of unique_so_list) {
//                 cancel_pick_list(so_id);
//             }
//             console.log("Unique Sales Orders:", unique_so_list);
//         } else {
//             console.log("result", "no so id found");
//         }
//     }
// });

// function cancel_pick_list(so_id) {
//     frappe.call({
//         method: 'get_pick_list_frm_dn',  // Your custom backend method
//         args: {
//             so_id: so_id
//         },
//         callback: function (response) {
//             if (response.message && response.message.length > 0) {
//                 let picklistid = response.message[0].pick_list_id;

//                 // Now cancel the Pick List using frappe.client.cancel
//                 frappe.call({
//                     method: "frappe.client.cancel",
//                     args: {
//                         doctype: "Pick List",
//                         name: picklistid
//                     },
//                     callback: function (res) {                        
//                         console.log("Cancelled:", picklistid);
//                     }
//                 });

//             } else {
//                 console.log("No Pick List found for SO:", so_id);
//             }
//         }
//     });
// }