frappe.ui.form.on('Pick List', {
    validate: async function(frm) {
        await generateUniqueItems(frm); // wait for API calls
    }
});

function generateUniqueItems(frm) {
    return new Promise((resolve) => {
        let unique_items = {};

        frm.doc.locations.forEach(item => {
            let code = item.item_code;

            if (unique_items[code]) {
                unique_items[code].qty += parseFloat(item.qty) || 0;

                if (item.batch_no && !unique_items[code].batch_nos.split(', ').includes(item.batch_no)) {
                    unique_items[code].batch_nos += `, ${item.batch_no}`;
                }

                if (item.warehouse && !unique_items[code].warehouses.split(', ').includes(item.warehouse)) {
                    unique_items[code].warehouses += `, ${item.warehouse}`;
                }

            } else {
                unique_items[code] = {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    uom: item.uom,
                    qty: parseFloat(item.qty) || 0,
                    batch_nos: item.batch_no || '',
                    warehouses: item.warehouse || '',
                    so_name: item.sales_order || ''
                };
            }
        });

        let result_list = Object.values(unique_items);

        addChildTable(frm, result_list).then(resolve); // resolve when done
    });
}

function addChildTable(frm, result_list) {
    frm.clear_table("custom_unique_items");

    if (result_list.length === 0) return Promise.resolve();

    const promises = result_list.map((row) => {
        if (!row.so_name) return Promise.resolve();

        return frappe.call({
            method: 'get_so_item_details', // update path
            args: {
                parent: row.so_name,
                item_code: row.item_code
            }
        }).then((r) => {
            const result = r.message;
            if (result && result.length > 0) {
                let soQty = parseFloat(result[0].qty) || 0;
                let picked_qty = parseFloat(row.qty) || 0;
                let pendingQty = soQty - picked_qty;

                let child = frm.add_child("custom_unique_items");
                child.custom_id = generateRandomID();
                child.item = row.item_code;
                 child.item_name = row.item_name;
                child.uom = row.uom;
                child.picked_qty = picked_qty;
                child.pending_qty = pendingQty;
                child.warehouse = row.warehouses;
                child.batch_no = row.batch_nos;
            }
        });
    });

    return Promise.all(promises).then(() => {
        frm.refresh_field("custom_unique_items");
    });
}

function generateRandomID(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
