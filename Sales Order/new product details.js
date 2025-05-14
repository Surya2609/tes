frappe.ui.form.on('Sales Order Item', {
    custom_product_details: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if (item.item_code) {
            fetch_product_details(item)
        }
    }
});

function fetch_product_details(item) {
    frappe.call({
        method: 'get_product_details',
        args: {
            item_code: item.item_code
        },
        callback: function (r) {
            if (r.message) {
                let pro_data = r.message;
                console.log("New Data:", pro_data);

                let product_details = {
                    item_name: pro_data[0].item_name,
                    item_code: pro_data[0].item_code,
                    unit: pro_data[0].stock_uom,
                    total_stock: pro_data[0].total_stock
                };

                // Convert alternate_uoms string to object
                let uom_map = {};
                if (pro_data[0].alternate_uoms) {
                    pro_data[0].alternate_uoms.split(',').forEach(entry => {
                        let [uom, val] = entry.split(':').map(x => x.trim());
                        uom_map[uom] = parseFloat(val);
                    });
                }

                // Define logic to get converted UOM stock
                let default_uom = product_details.unit;
                let target_uom = default_uom === 'Nos' ? 'Kg' : default_uom === 'Kg' ? 'Nos' : null;
                let default_factor = uom_map[default_uom] || 1;
                let target_factor = uom_map[target_uom] || 1;

console.log("target", target_factor);
console.log("default_factor", default_factor);
console.log("targer_uom", target_uom);

console.log("total_stock", product_details.total_stock);
console.log("def uom", default_uom);
console.log("tar uom", target_uom);

                let converted_total_stock = null;
                if (target_uom && default_factor && target_factor) {


                    if(target_uom == "Nos" && default_uom == "Kg") {
                        console.log("invoked with default kg to nos");
                        converted_total_stock = (product_details.total_stock / target_factor).toFixed(4);
                    }

                    if(target_uom == "Kg" && default_uom == "Nos"){
                        console.log("invoked with default nos to kg");
                        converted_total_stock = (product_details.total_stock * target_factor).toFixed(4);
                    }

                    // converted_total_stock = (product_details.total_stock * target_factor / default_factor).toFixed(2);
                }

                // Build the table data
                let table_data = pro_data.map(row => {
                    let converted_stock = null;
                    if (target_uom && default_factor && target_factor) {
                        if (default_uom === "Kg" && target_uom === "Nos") {
                            // 1 Kg = 0.00082 Nos → Nos = Kg / 0.00082
                            converted_stock = (row.stock_in_warehouse / target_factor).toFixed(4);
                        } else if (default_uom === "Nos" && target_uom === "Kg") {
                            // Nos to Kg → Kg = Nos × 0.00082
                            converted_stock = (row.stock_in_warehouse * target_factor).toFixed(4);
                        }
                    }
                
                    return {
                        item_name: row.item_name,
                        warehouse: row.warehouse,
                        stock_in_warehouse: row.stock_in_warehouse,
                        uom_stock: converted_stock
                    };
                });

                // Create the dialog
                let product_dialogue = new frappe.ui.Dialog({
                    title: 'Product Details',
                    size: 'large',
                    fields: [
                        {
                            fieldname: 'product_details',
                            fieldtype: 'HTML',
                            options: `
                                <div style="margin-bottom: 10px; font-family: Arial, sans-serif;">
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <div style="font-weight: bold; width: 50%;">Product Name:</div>
                                        <div style="text-align: left; width: 50%;">${product_details.item_name}</div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <div style="font-weight: bold; width: 50%;">Product ID:</div>
                                        <div style="text-align: left; width: 50%;">${product_details.item_code}</div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                        <div style="font-weight: bold; width: 50%;">Unit:</div>
                                        <div style="text-align: left; width: 50%;">${product_details.unit}</div>
                                    </div>
                                    
                                    ${product_details.is_asset ? '' : `
                                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                            <div style="font-weight: bold; width: 50%;">Total Stocks (${default_uom}):</div>
                                            <div style="text-align: left; width: 50%;">${product_details.total_stock}</div>
                                        </div>
                                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                            <div style="font-weight: bold; width: 50%;">Total Stocks (${target_uom}):</div>
                                            <div style="text-align: left; width: 50%;">${converted_total_stock}</div>
                                        </div>
                                    `}
                                </div>
                            `
                        },
                        {
                            fieldname: 'stock_table',
                            fieldtype: 'Table',
                            cannot_add_rows: true,
                            cannot_delete_rows: true,
                            fields: [
                                {
                                    label: 'Item Name',
                                    fieldname: 'item_name',
                                    fieldtype: 'Data',
                                    in_list_view: 1,
                                    read_only: 1
                                },
                                {
                                    label: 'Warehouse',
                                    fieldname: 'warehouse',
                                    fieldtype: 'Data',
                                    in_list_view: 1,
                                    read_only: 1
                                },
                                {
                                    label: 'Warehouse Stock',
                                    fieldname: 'stock_in_warehouse',
                                    fieldtype: 'Float',
                                    in_list_view: 1,
                                    read_only: 1
                                },
                                {
                                    label: `Conversion (${target_uom}) Stock`,
                                    fieldname: 'uom_stock',
                                    fieldtype: 'Float',
                                    in_list_view: 1,
                                    read_only: 1
                                }
                            ],
                            data: table_data
                        },
                    ],
                    primary_action_label: 'Cancel',
                    primary_action() {
                        product_dialogue.hide();
                    },
                    secondary_action_label: 'DN History',
                    secondary_action() {
                        product_dialogue.hide();
                        // dn_dialogue.show();
                    },
                });

                product_dialogue.show();
            }
        }
    });
}
