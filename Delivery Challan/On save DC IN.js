frappe.ui.form.on('Delivery Challan', {
    before_save: function(frm) {
        let items = frm.doc.items;
        let referenceMap = {};

        // Iterate over line items
        items.forEach(row => {
            let refId = row.reference_id;

            if (refId) {
                if (!referenceMap[refId]) {
                    referenceMap[refId] = 0;
                }
                referenceMap[refId] += parseFloat(row.qty) || 0; // Summing qty
            }
        });

        // Print each reference_id's total qty
        console.log("Total qty for each reference_id:");
        Object.keys(referenceMap).forEach(refId => {
            console.log(`Reference ID: ${refId}, Total Qty: ${referenceMap[refId]}`);
        });
    }
});