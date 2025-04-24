frappe.ui.form.on('Pick List', {
    refresh: function (frm) {
        let unique_items = {};

        frm.doc.locations.forEach(item => {
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
                    so_name: item.sales_order || ''
                };
            }
        });

        let result_list = Object.values(unique_items);

        addChildTable(frm, result_list);
        console.log("Final List:", result_list);
    }
});

function addChildTable(frm, result_list) {
    frm.clear_table("custom_unique_items");

    if (result_list.length === 0) return;

    const promises = result_list.map((row) => {
        if (row.so_name) {
            return frappe.db.get_list('Sales Order Item', {
                filters: {
                    parent: row.so_name,
                    item_code: row.item_code
                },
                fields: ['item_code', 'qty', 'parent'],
                limit_page_length: 1
            }).then((result) => {

                if (result && result.length > 0) {
                    let soQty = parseFloat(result[0].qty) || 0;
                    let picked_qty = parseFloat(row.qty) || 0;
                    let pendingQty = soQty - picked_qty;

                    console.log("so qty", soQty);
                    console.log("picked qty", picked_qty);
                    console.log("pendig qty", pendingQty);

                    let child = frm.add_child("custom_unique_items");
                    child.item = row.item_code;
                    child.uom = row.uom;
                    child.picked_qty = row.qty;
                    child.pending_qty = pendingQty;
                    child.warehouse = row.warehouses;
                    child.batch_no = row.batch_nos;
                }
            });
        }
    });

    Promise.all(promises).then(() => {
        frm.refresh_field("custom_unique_items");
    });
}

