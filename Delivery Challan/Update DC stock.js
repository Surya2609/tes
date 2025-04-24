frappe.ui.form.on("Stock Entry", {
    before_save: function (frm) {
        if (frm.doc.stock_entry_type === "Manufacture" && frm.doc.work_order != null) {
            let found = false;
            let sfg_item = "";
            let sfg_qty = "";
            let uom = "";
            frm.doc.items.forEach(item => {
                console.log(`Item Code: ${item.item_code}, Target Warehouse: ${item.t_warehouse}`);
                if (item.t_warehouse === "Semi Finished  - MFPLD") {
                    found = true;
                    sfg_item = item.item_code;
                    sfg_qty = item.qty;
                    uom = item.uom;
                    console.log("uom", uom);
                }
            });
            if (found) {
                frappe.call({
                    method: "frappe.client.insert",
                    args: {
                        doc: {
                            doctype: "Delivery Challan Stocks",
                            dc_out_qty: "--",
                            dc_in_qty: "--",
                            uom: uom,
                            item: sfg_item,  // Change this to match Work Order's item field
                            reference_id: frm.doc.work_order,  // Work Order ID
                            qty: sfg_qty,  // Work Order Quantity
                            remaining_qty: sfg_qty,  // Default to 0
                            from: "Work Order"
                        }
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint("Delivery Challan Stocks created successfully!");
                        } else {
                            frappe.msgprint("Error creating Delivery Challan Stocks: " + response.exc);
                        }
                    }
                });
            }
        }
    }
});


frappe.ui.form.on("Purchase Receipt", {
    refresh: function (frm) {
        frm.add_custom_button("Test Update DCS", function () {
            console.log(frm.doc);
            frm.doc.items.forEach(item => {  // Loop through each Purchase Receipt item
                console.log(item.custom_item_batch_no);
                if (item.warehouse === "Semi Finished  - MFPLD" && item.custom_item_batch_no) {
                    console.log(item.custom_item_batch_no);
                    frappe.call({
                        method: "frappe.client.insert",
                        args: {
                            doc: {
                                doctype: "Delivery Challan Stocks",
                                item: item.item_code,   // Item Code from Purchase Receipt Items
                                reference_id: item.custom_item_batch_no || "",  // Reference to Purchase Receipt
                                qty: item.qty,  // Quantity from Purchase Receipt Items       
                                uom: item.uom,
                                remaining_qty: item.qty,  // Default remaining quantity
                                dc_out_qty: "--",
                                dc_in_qty: "--",
                                receipt_ref_id: frm.doc.name,  // If batch_no exists, add it
                                supplier: frm.doc.supplier,  // Supplier from Purchase Receipt
                                from: "Purchase Receipt"
                            }
                        },
                        callback: function (response) {
                            if (!response.exc) {
                                frappe.msgprint(`Delivery Challan Stocks created for Item: ${item.item_code}`);
                            } else {
                                frappe.msgprint("Error creating Delivery Challan Stocks: " + response.exc);
                            }
                        }
                    });
                }
            });
        })
    }
});