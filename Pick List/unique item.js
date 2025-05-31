frappe.ui.form.on('Pick List', {
    refresh: function (frm) {
        frm.add_custom_button("test", function () {
            getLocationQty("MV7500POCHM612S", "73D2 - MVDF");
        });
    },

    validate: async function (frm) {
        await generateUniqueItems(frm); // wait for API calls
    }
});


async function generateUniqueItems(frm) {
    let unique_items = {};

    for (const item of frm.doc.locations) {
        const code = item.item_code;

        if (unique_items[code]) {

            const qty = await getLocationQty(code, item.warehouse); // dynamically use item code and warehouse

            unique_items[code].stockQty += parseFloat(qty[0].actual_qty) || 0;

            unique_items[code].qty += parseFloat(item.qty) || 0;

            if (item.batch_no && !unique_items[code].batch_nos.split(', ').includes(item.batch_no)) {
                unique_items[code].batch_nos += `, ${item.batch_no}`;
            }

            if (item.warehouse && !unique_items[code].warehouses.split(', ').includes(item.warehouse)) {
                unique_items[code].warehouses += `, ${item.warehouse}`;
            }

        } else {
            const qty = await getLocationQty(code, item.warehouse); // dynamically use item code and warehouse
            let stockUom = "--";

            if (qty.length == 1) {
                stockUom = qty[0].stock_uom;
            }

            console.log("length", qty.length);
            console.log("st qty", qty[0].actual_qty);
            console.log("st uom", qty[0].stock_uom);

            unique_items[code] = {
                item_code: item.item_code,
                item_name: item.item_name,
                uom: item.uom,
                qty: parseFloat(item.qty) || 0,
                batch_nos: item.batch_no || '',
                warehouses: item.warehouse || '',
                so_name: item.sales_order || '',
                stock_qty: parseFloat(qty[0].actual_qty) || 0,
                stock_uom: stockUom || ""
            };
        }
    }

    const result_list = Object.values(unique_items);
    await addChildTable(frm, result_list); // Wait for child table update
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
                console.log("result", result);

                let soQty = parseFloat(result[0].qty) || 0;
                let picked_qty = parseFloat(row.qty) || 0;
                let delivered_qty = parseFloat(result[0].delivered_qty) || 0;
                
                let pendingQty = soQty - delivered_qty;
                console.log("delivered_qty", delivered_qty);
             

                let child = frm.add_child("custom_unique_items");
                child.custom_id = generateRandomID();
                child.item = row.item_code;
                child.item_name = row.item_name;
                child.uom = row.uom;
                child.picked_qty = picked_qty;
                child.pending_qty = pendingQty;
                child.warehouse = row.warehouses;
                child.batch_no = row.batch_nos;
                child.stock_qty = row.stock_qty;
                child.stock_uom = row.stock_uom;
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



async function getLocationQty(item, location) {
    console.log("itm", item);
    console.log("lcn", location);
    try {
        const response = await frappe.call({
            method: "get_total_location_qty",
            args: {
                item_code: item,
                location: location
            }
        });

        console.log("res message", response.message);
        return response.message;  // You can use this value where you call the function

    } catch (error) {
        console.error("Error fetching location qty:", error);
        return null;
    }
}