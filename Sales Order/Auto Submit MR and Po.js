frappe.ui.form.on('Sales Order', {
    custom_testing_button: function (frm) {
        let low_stock_items = [];
        let promises = [];

        if (frm.doc.items && frm.doc.items.length > 0) {
            frm.doc.items.forEach(function (row) {
                if (row.item_code) {
                    let promise = new Promise((resolve, reject) => {
                        frappe.call({
                            method: 'get_product_details', // Replace with your actual method path
                            args: {
                                item_code: row.item_code
                            },
                            callback: function (r) {
                                if (r.message) {
                                    let total_qty = r.message[0].total_stock;
                                    let moq = r.message[0].min_order_qty;

                                    if (row.qty > total_qty) {
                                        low_stock_items.push({
                                            item_code: row.item_code,
                                            item_name: r.message[0].item_name,
                                            uom: r.message[0].stock_uom,
                                            description: r.message[0].description || '',
                                            rate: r.message[0].rate || 0,
                                            moq: moq,
                                            required_qty: row.qty - total_qty
                                        });
                                    }
                                    resolve();
                                } else {
                                    reject("No response message");
                                }
                            }
                        });
                    });

                    promises.push(promise);
                }
            });

            // Wait for all promises to resolve
            Promise.all(promises)
                .then(() => {
                    if (low_stock_items.length > 0) {
                        frappe.confirm(
                            __('The following items have low stock: {0}. Do you want to create a Material Request and Purchase Order?', [low_stock_items.map(i => i.item_code).join(', ')]),
                            () => {
                                // Ask for Supplier
                                frappe.prompt(
                                    [
                                        {
                                            fieldname: 'supplier',
                                            fieldtype: 'Link',
                                            options: 'Supplier',
                                            label: __('Select Supplier'),
                                            reqd: 1
                                        }
                                    ],
                                    (values) => {
                                        let supplier = values.supplier;

                                        // Step 1: Create Material Request
                                        frappe.call({
                                            method: 'frappe.client.insert',
                                            args: {
                                                doc: {
                                                    doctype: 'Material Request',
                                                    material_request_type: 'Purchase',
                                                    items: low_stock_items.map(item => ({
                                                        item_code: item.item_code,
                                                        item_name: item.item_name,
                                                        uom: item.uom,
                                                        description: item.description,
                                                        qty: item.moq && item.moq > 0 ? item.moq : item.required_qty,
                                                        schedule_date: frappe.datetime.now_date()
                                                    }))
                                                }
                                            },
                                            callback: function (r) {
                                                if (r.message) {
                                                    let material_request_name = r.message.name;

                                                    // Step 2: Submit the Material Request
                                                    frappe.call({
                                                        method: 'frappe.client.submit',
                                                        args: {
                                                            doc: r.message
                                                        },
                                                        callback: function () {
                                                            frappe.msgprint(__('Material Request {0} submitted successfully.', [`<a href="/app/material-request/${material_request_name}">${material_request_name}</a>`]));

                                                            // Step 3: Create Purchase Order linked to the Material Request
                                                            frappe.call({
                                                                method: 'frappe.client.insert',
                                                                args: {
                                                                    doc: {
                                                                        doctype: 'Purchase Order',
                                                                        supplier: supplier,
                                                                        items: low_stock_items.map(item => ({
                                                                            item_code: item.item_code,
                                                                            item_name: item.item_name,
                                                                            uom: item.uom,
                                                                            description: item.description,
                                                                            rate: item.rate,
                                                                            qty: item.moq && item.moq > 0 ? item.moq : item.required_qty,
                                                                            schedule_date: frappe.datetime.now_date(),
                                                                            material_request: material_request_name, // Link Material Request
                                                                            material_request_item: r.message.items.filter(i => i.item_code === item.item_code)[0]?.name // Assign the material_request_item to PO
                                                                        }))
                                                                    }
                                                                },
                                                                callback: function (po_result) {
                                                                    if (po_result.message) {
                                                                        frappe.msgprint(__('Purchase Order {0} created successfully in Draft.', [`<a href="/app/purchase-order/${po_result.message.name}">${po_result.message.name}</a>`]));
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    },
                                    __('Select Supplier'),
                                    __('Create')
                                );
                            },
                            () => {
                                frappe.show_alert(__('Material Request and Purchase Order creation canceled.'));
                            }
                        );
                    } else {
                        console.log("All items have sufficient stock.");
                    }
                })
                .catch(error => {
                    console.error("Error checking stock:", error);
                });

            frappe.validated = false;
        }
    }
});
