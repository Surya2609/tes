frappe.ui.form.on('Purchase Receipt', {
    before_save: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS 1") {
            console.log("Validating ASN values...");

            if (frm.doc.custom_asn) {
                let porQty = parseFloat(frm.doc.total_qty) || 0;
                let porAmt = parseFloat(frm.doc.total) || 0;
                let asnQty = parseFloat(frm.doc.custom_asn_total_qty) || 0;
                let asnAmt = parseFloat(frm.doc.custom_asn_total_amount) || 0;

                // Subtract shipping charges
                (frm.doc.items || []).forEach(row => {
                    if (row.item_code && row.item_code.toLowerCase() === 'Shipping charges') {
                        console.log("Shipping row qty:", row.qty);
                        console.log("Shipping row:", row);
                        porQty -= parseFloat(row.qty) || 0;
                        porAmt -= parseFloat(row.rate) || 0; // rate == amount usually
                    }
                });

                // Optional: rounding to avoid float precision issues
                porQty = Math.round(porQty * 1000) / 1000;
                porAmt = Math.round(porAmt * 100) / 100;

                if (porQty !== asnQty) {
                    frappe.throw(`ASN Qty (${asnQty}) does not match Total Qty (${porQty})`);
                } else if (porAmt !== asnAmt) {
                    frappe.throw(`ASN Amount (${asnAmt}) does not match Total Amount (${porAmt})`);
                }
            }
        }
    },
    before_submit: async function (frm) {
        if (frm.doc.company == "MVD FASTENERS 1") {
            if (frm.doc.custom_asn && frm.doc.custom_quality_status == "Quality Completed") {
                await frappe.db.set_value('Advance Shipment Notice', frm.doc.custom_asn, 'completed', 1);
                frappe.msgprint(__('ASN marked as completed.'));
            }
        }
    }
});