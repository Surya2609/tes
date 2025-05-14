frappe.ui.form.on('Delivery Note', {
    refresh: function (frm) {
        frm.add_custom_button("Unique", function () {
        
                   let unique_items = {};

        frm.doc.items.forEach(item => {
            let code = item.item_code;

            if (unique_items[code]) {
                unique_items[code].qty += flt(item.qty);

                // Handle batch_no as comma-separated string
                if (item.batch_no && !unique_items[code].batch_nos.split(', ').includes(item.batch_no)) {
                    unique_items[code].batch_nos += `, ${item.batch_no}`;
                }

                // Handle warehouse the same way
                if (item.warehouse && !unique_items[code].warehouses.split(', ').includes(item.warehouse)) {
                    unique_items[code].warehouses += `, ${item.warehouse}`;
                }

            } else {
                console.log("itm uom", item.uom);
                unique_items[code] = {
                    item_code: item.item_code,
                    uom: item.uom,
                    qty: flt(item.qty),
                    batch_nos: item.batch_no || '',
                    warehouses: item.warehouse || '',
                    so_name: item.against_sales_order || ''
                };
            }
        });

        let result_list = Object.values(unique_items);

        addChildTable(frm, result_list);
        console.log("Final List:", result_list);
        })}
    
});

function addChildTable(frm, result_list) {
    console.log("inv", frm.doc);
    console.log("inv1", result_list);
    frm.clear_table("custom_dn_unique_items");

    if (result_list.length === 0) return;

    const promises = result_list.map((row) => {
        if (!row.so_name) return Promise.resolve(); // skip if no Sales Order

        return frappe.call({
            method: 'get_so_item_details', // ✅ Replace with full path
            args: {
                parent: row.so_name,
                item_code: row.item_code
            }
        }).then((r) => {            
            const result = r.message;
            console.log("res",result);
            if (result && result.length > 0) {
                let soQty = parseFloat(result[0].qty) || 0;
                let picked_qty = parseFloat(row.qty) || 0;
                let pendingQty = soQty - picked_qty;

                let child = frm.add_child("custom_dn_unique_items");
                child.custom_id = generateRandomID(); // Replace with your actual ID generator
                child.item = row.item_code;
                child.uom = row.uom;
                child.picked_qty = picked_qty;
                child.pending_qty = pendingQty;
                child.warehouse = row.warehouses;
                child.batch_no = row.batch_nos;
            }
        });
    });

    Promise.all(promises).then(() => {
        frm.refresh_field("custom_dn_unique_items");
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