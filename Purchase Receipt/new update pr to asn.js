frappe.ui.form.on('Purchase Receipt', {
    before_save: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS 1" || frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            console.log("Validating ASN values...");

            if (frm.doc.custom_asn) {
                let porQty = parseFloat(frm.doc.total_qty) || 0;
                let porAmt = parseFloat(frm.doc.total) || 0;
                let asnQty = parseFloat(frm.doc.custom_asn_total_qty) || 0;
                let asnAmt = parseFloat(frm.doc.custom_asn_total_amount) || 0;

                console.log("porAmt:", porAmt);
                console.log("asnAmt:", asnAmt);


                // Subtract shipping charges
                (frm.doc.items || []).forEach(row => {
                    console.log("row1", row);
                    if (row.item_code && row.item_code.toLowerCase() === 'shipping charges') {
                        console.log("Shipping row qty:", row.qty);
                        console.log("Shipping row:", row);
                        porQty -= parseFloat(row.qty) || 0;
                        porAmt -= parseFloat(row.rate) || 0; // rate == amount usually
                    }
                });


                // Round both amounts to 2 decimal places
                porAmt = Math.round(porAmt * 100) / 100;
                asnAmt = Math.round(asnAmt * 100) / 100;  // ADD THIS LINE

                // Round quantities as needed
                porQty = Math.round(porQty * 1000) / 1000;
                asnQty = Math.round(asnQty * 1000) / 1000;  // Optional for safety
                
                console.log("porAmt:", porAmt);
                console.log("asnAmt:", asnAmt);
                if (porQty !== asnQty) {
                    frappe.throw(`ASN Qty (${asnQty}) does not match Total Qty (${porQty})`);
                } else if (porAmt !== asnAmt) {
                    frappe.throw(`ASN Amount (${asnAmt}) does not match Total Amount (${porAmt})`);
                }
            }
        }
    },

    on_submit: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS 1" || frm.doc.company == "MVD FASTENERS PRIVATE LIMITED") {
            if (frm.doc.custom_asn) {
                await frappe.db.set_value('Advance Shipment Notice', frm.doc.custom_asn, 'completed', 1);
                frappe.msgprint(__('ASN marked as completed.'));
            }
        }
    }
});