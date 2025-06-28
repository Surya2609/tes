frappe.ui.form.on('Advance Shipment Notice', {
    validate: function (frm) {
        let itemPoSet = new Set();
        let duplicates = [];

        (frm.doc.items || []).forEach(row => {
            let key = `${row.item}__${row.po_no}`;
            if (itemPoSet.has(key)) {
                duplicates.push(`${row.item} (PO: ${row.po_no})`);
            } else {
                itemPoSet.add(key);
            }
        });

        if (duplicates.length > 0) {
            frappe.throw(`Duplicate Item + PO No found: <b>${[...new Set(duplicates)].join(', ')}</b>`);
        }
    }
});
