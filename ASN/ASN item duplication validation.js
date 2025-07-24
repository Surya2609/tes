// frappe.ui.form.on('Advance Shipment Notice', {
//     validate: async function (frm) {
//         // 1️⃣ Check if ASN is already linked to any draft or submitted Purchase Receipt
//         const pr_list = await frappe.db.get_list('Purchase Receipt', {
//             filters: {
//                 custom_asn: frm.doc.name
//             },
//             fields: ['name', 'docstatus'],
//             limit: 1000
//         });

//         if (pr_list && pr_list.length > 0) {
//             const pr = pr_list.find(r => r.docstatus === 0 || r.docstatus === 1);
//             if (pr) {
//                 frappe.throw(`This ASN <b>${frm.doc.name}</b> is already linked to a submitted/draft Purchase Receipt <b>${pr.name}</b>.`);
//             }
//         }

//         // 2️⃣ Check for duplicate Item + PO No
//         let itemPoSet = new Set();
//         let duplicates = [];

//         let total_qty = 0;
//         let total_amount = 0;

//         (frm.doc.items || []).forEach(row => {
//             let key = `${row.item}__${row.po_no}`;
//             if (itemPoSet.has(key)) {
//                 duplicates.push(`${row.item} (PO: ${row.po_no})`);
//             } else {
//                 itemPoSet.add(key);
//             }

//             total_qty += flt(row.qty);
//             total_amount += flt(row.amount);
//         });

//         if (duplicates.length > 0) {
//             frappe.throw(`Duplicate Item + PO No found: <b>${[...new Set(duplicates)].join(', ')}</b>`);
//         }




//         (frm.doc.items || []).forEach(row => {
//             if (row.convertion_factor != 0) {
//                 let stockQty = row.qty * row.convertion_factor;
//                 console.log("st qty", stockQty);
//                 frappe.model.set_value(row.doctype, row.name, 'stock_uom_qty', stockQty);
//             }
//         });

//         // 3️⃣ Set total_qty and total_amount
//         frm.set_value('total_qty', total_qty);
//         frm.set_value('total_amount', total_amount);
//     }
// });



frappe.ui.form.on('Advance Shipment Notice', {
    validate: async function (frm) {
        // 1️⃣ Check if ASN is already linked to any draft or submitted Purchase Receipt
        const pr_list = await frappe.db.get_list('Purchase Receipt', {
            filters: {
                custom_asn: frm.doc.name
            },
            fields: ['name', 'docstatus'],
            limit: 1000
        });

        if (pr_list && pr_list.length > 0) {
            const pr = pr_list.find(r => r.docstatus === 0 || r.docstatus === 1);
            if (pr) {
                frappe.throw(`This ASN <b>${frm.doc.name}</b> is already linked to a submitted/draft Purchase Receipt <b>${pr.name}</b>.`);
            }
        }

        // 2️⃣ Check for duplicate Item + PO No
        let itemPoSet = new Set();
        let duplicates = [];

        let total_qty = 0;
        let total_amount = 0;

        (frm.doc.items || []).forEach(row => {
            let key = `${row.item}__${row.po_no}`;
            if (itemPoSet.has(key)) {
                duplicates.push(`${row.item} (PO: ${row.po_no})`);
            } else {
                itemPoSet.add(key);
            }

            total_qty += flt(row.qty);
            total_amount += flt(row.amount);
        });

        if (duplicates.length > 0) {
            frappe.throw(`Duplicate Item + PO No found: <b>${[...new Set(duplicates)].join(', ')}</b>`);
        }

        (frm.doc.items || []).forEach(row => {
            if (row.convertion_factor != 0) {
                let stockQty = row.qty * row.convertion_factor;
                console.log("st qty", stockQty);
                frappe.model.set_value(row.doctype, row.name, 'stock_uom_qty', stockQty);
            }
        });

        // 3️⃣ Set total_qty and total_amount
        frm.set_value('total_qty', total_qty);
        frm.set_value('total_amount', total_amount);
    }
});