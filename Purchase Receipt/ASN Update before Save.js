frappe.ui.form.on('Purchase Receipt', {
    validate: async function (frm) {
        if (frm.dco.company == "MVD FASTENERS PRIVATE LIMITED") {
            let mismatched_items = [];
            let matched_items = [];

            for (let i = 0; i < frm.doc.items.length; i++) {
                let item = frm.doc.items[i];
                let asn_qty = parseFloat(item.custom_asn_qty || 0);
                let qty = parseFloat(item.qty || 0);

                if (asn_qty !== qty) {
                    mismatched_items.push(`Row ${i + 1} - ${item.item_code}`);
                } else if (asn_qty !== 0 && item.custom_asn_id && asn_qty === qty) {
                    matched_items.push(item);
                }
            }
            console.log("mismatched_items", mismatched_items);

            if (mismatched_items.length > 0) {
                let message = `The following items have ASN Qty mismatch:\n\n${mismatched_items.join('\n')}\n\nDo you still want to submit?`;

                // Return a promise so validate waits
                await new Promise((resolve, reject) => {
                    frappe.confirm(
                        message,
                        async () => {
                            // On OK: proceed with matched ASN updates
                            for (let item of matched_items) {
                                await updateAsnDone(item.custom_asn_id, item.item_code, frm.doc.name);
                            }
                            resolve();  // allow submit
                        },
                        () => {
                            frappe.msgprint("Submission cancelled due to ASN Qty mismatch.");
                            reject("Cancelled by user"); // prevent submit
                        }
                    );
                });
            } else {
                // No mismatches — update ASN as usual
                for (let item of matched_items) {
                    await updateAsnDone(item.custom_asn_id, item.item_code, frm.doc.name);
                }
            }
        }

    }
    // before_submit: async function (frm) {
    //     for (let item of frm.doc.items) {      
    //         let asn_qty = parseFloat(item.custom_asn_qty || 0);
    //         let qty = parseFloat(item.qty || 0);

    //         if (asn_qty != 0 && item.custom_asn_id && frm.doc.name) {

    //             if (asn_qty == qty) {
    //                 await updateAsnDone(item.custom_asn_id, item.item_code, frm.doc.name);
    //             }
    //         }
    //     }
    // }
});

async function updateAsnDone(asn_id, item_code, por_id) {
    const result = await frappe.call({
        method: 'get_asn_child_id',
        args: {
            asn_id: asn_id,
            item_code: item_code
        }
    });
    console.log("res", result);

    if (result.message && result.message.length > 0) {
        const child_name = result.message[0].name;
        console.log("child id", child_name);

        await frappe.call({
            method: 'frappe.client.set_value',
            args: {
                doctype: 'Advance Shipment Child',
                name: child_name,
                fieldname: {
                    done: 1,
                    purchase_receipt: por_id
                }
            }
        });
    }
}