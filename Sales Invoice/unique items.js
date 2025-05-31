frappe.ui.form.on('Sales Invoice', {
    // validate: function (frm) {
    //       if (!frm.doc.custom_si_unique_items || frm.doc.custom_si_unique_items.length === 0) {
    //           frappe.throw(__('Unique Items table cannot be empty.'));
    //       }
    //   },

    refresh: function (frm) {
        frm.add_custom_button("Unique", async function () {
            await generateUniqueItems(frm); // now 'await' works correctly
        });
    },

    after_save: async function (frm) {
        if (!frm.doc.custom_unique_items_generated) {
            console.log("Invoking generateUniqueItems only once after save");
            await generateUniqueItems(frm);

            frm.set_value("custom_unique_items_generated", 1);
            await frm.save();
        }
    }
});

function generateUniqueItems(frm) {
    return new Promise((resolve) => {
        let unique_items = {};

        frm.doc.items.forEach(item => {
            let code = item.item_code;
            let unit_rate = item.custom_unit_rate;
            let key = `${code}_${unit_rate}`; // group only if unit_rate also matches

            if (unique_items[key]) {
                unique_items[key].igst_amount += parseFloat(item.igst_amount) || 0;
                unique_items[key].cgst_amount += parseFloat(item.cgst_amount) || 0;
                unique_items[key].sgst_amount += parseFloat(item.sgst_amount) || 0;

                unique_items[key].amount += parseFloat(item.amount) || 0;
                unique_items[key].qty += parseFloat(item.qty) || 0;

                if (item.batch_no && !unique_items[key].batch_nos.split(', ').includes(item.batch_no)) {
                    unique_items[key].batch_nos += `, ${item.batch_no}`;
                }

                if (item.sales_order && !unique_items[key].batch_nos.split(', ').includes(item.sales_order)) {
                    unique_items[key].sales_order += `, ${item.sales_order}`;
                }

                if (item.warehouse && !unique_items[key].warehouses.split(', ').includes(item.warehouse)) {
                    unique_items[key].warehouses += `, ${item.warehouse}`;
                }

            } else {
                unique_items[key] = {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    description: item.description,
                    customer_part_code: item.custom_customer_part_code,
                    customer_discription: item.custom_customer_description,
                    uom: item.uom,
                    qty: parseFloat(item.qty) || 0,
                    rate: item.rate,
                    unit_rate: item.custom_unit_rate,
                    amount: item.amount,
                    hsn_code: item.gst_hsn_code,
                    igst_rate: item.igst_rate,
                    cgst_rate: item.cgst_rate,
                    sgst_rate: item.sgst_rate,

                    igst_amount: parseFloat(item.igst_amount) || 0,
                    cgst_amount: parseFloat(item.cgst_amount) || 0,
                    sgst_amount: parseFloat(item.sgst_amount) || 0,

                    sales_order: item.sales_order || '',
                    batch_nos: item.batch_no || '',
                    warehouses: item.warehouse || '',
                    // so_name: item.sales_order || ''
                };
            }
        });

        let result_list = Object.values(unique_items);
        addChildTable(frm, result_list).then(resolve); // resolve when done
    });
}


function addChildTable(frm, result_list) {
    console.log("result_list", result_list);
    frm.clear_table("custom_si_unique_items");

    if (result_list.length === 0) return Promise.resolve();

    const promises = result_list.map((row) => {
        console.log("tes", row);
        if (row.item_code == "SERVICE CHARGES" || row.item_code == "Shipping charges") {
            let child = frm.add_child("custom_si_unique_items");
            child.custom_id = generateRandomID();
            child.item = row.item_code;
            child.item_name = row.item_name;
            child.rate = row.rate;
            child.amount = row.amount;

            child.igst_rate = parseFloat(row.igst_rate) || 0;
            child.sgst_rate = parseFloat(row.sgst_rate) || 0;
            child.cgst_rate = parseFloat(row.cgst_rate) || 0;

            child.igst_amount = parseFloat(row.igst_amount) || 0;
            child.sgst_amount = parseFloat(row.sgst_amount) || 0;
            child.cgst_amount = parseFloat(row.cgst_amount) || 0;

            return Promise.resolve();
        } else {
            console.log("r", row.unit_rate);
            let picked_qty = parseFloat(row.qty) || 0;
            //   let pendingQty = soQty - picked_qty;
            let child = frm.add_child("custom_si_unique_items");
            child.custom_id = generateRandomID();
            child.item = row.item_code;
            child.item_name = row.item_name;
            child.customer_part_code = row.customer_part_code;
            child.customer_part_description = row.customer_discription;
            child.description = row.description
            child.uom = row.uom;
            // child.rate = row.rate;
            child.rate = row.unit_rate;
            child.amount = row.amount;
            child.hsn_code = row.hsn_code;
            child.igst_rate = parseFloat(row.igst_rate) || 0;
            child.sgst_rate = parseFloat(row.sgst_rate) || 0;
            child.cgst_rate = parseFloat(row.cgst_rate) || 0;

            child.igst_amount = parseFloat(row.igst_amount) || 0;
            child.sgst_amount = parseFloat(row.sgst_amount) || 0;
            child.cgst_amount = parseFloat(row.cgst_amount) || 0;

            child.picked_qty = picked_qty;
            //   child.pending_qty = pendingQty;
            child.warehouse = row.warehouses;
            child.batch_no = row.batch_nos;
            child.sales_order = row.sales_order;
        }
    });

    return Promise.all(promises).then(() => {
        frm.refresh_field("custom_si_unique_items");
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