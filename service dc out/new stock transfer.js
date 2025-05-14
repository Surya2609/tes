frappe.ui.form.on('Service DC OUT', {
    refresh: function (frm) {
        frm.add_custom_button("Test adc", function () {
            create_stock_entry(frm);
        });

        if (frm.is_new() && !frm.doc.date) {
            frm.set_value('date', frappe.datetime.get_today());
        }
    },

    validate: function (frm) {
        let allValid = true;
        frm.doc.items.forEach((row, index) => {
            if (!frm.doc.supplier || !row.qty || !row.server_for || !row.source_warehouse || !row.target_warehouse || !row.uom || !row.item) {
                frappe.msgprint(__('Row {0}: Please fill all mandatory fields (Qty, Server For, Source Warehouse, Target Warehouse, Item).', [index + 1]));
                allValid = false;
            }
        });

        if (!allValid) {
            frappe.validated = false;
        }
    },

    before_submit: function (frm) {
        // Prevent multiple execution
        if (frm.doc._stock_entry_created) {
            return;
        }

        frappe.validated = false;

        create_stock_entry(frm).then(success => {
            if (success) {
                frm.doc._stock_entry_created = true;
                frm.save('Submit');
            } else {
                frappe.msgprint(__('Stock Entry creation failed. Submission halted.'));
            }
        });
    }
});

function create_stock_entry(frm) {
    return new Promise((resolve) => {
        get_company_by_user().then(company => {
            let items = [];
            frm.doc.items.forEach(item => {
                items.push({
                    uom: item.uom,
                    item_code: item.item,
                    qty: item.qty,
                    s_warehouse: item.source_warehouse,
                    t_warehouse: item.target_warehouse
                });
            });

            if (items.length === 0) {
                frappe.msgprint(__('No items to transfer.'));
                resolve(false);
                return;
            }

            let id = "";
            let series_map = {
                "REVURU FASTENERS PVT LTD": "RF-ST-.FY.-",
                "MVD FASTENERS PRIVATE LIMITED": "MV/ST/25-26-",
                "REVURU PRECISION LLP": "RPL-ST-25-26-"
            };

            if (series_map[company]) {
                id = series_map[company];
            }

            frappe.call({
                method: "frappe.client.insert",
                args: {
                    doc: {
                        doctype: "Stock Entry",
                        naming_series: id,
                        company: company,
                        stock_entry_type: "SUBCONTRACTOR MATERIAL TRANSFER CHALLAN",
                        from_bom: 0,
                        items: items
                    }
                },
                callback: function (response) {
                    if (response.message) {
                        frappe.call({
                            method: "frappe.client.submit",
                            args: {
                                doc: response.message
                            },
                            callback: function (submit_response) {
                                if (submit_response.message) {
                                    frappe.msgprint(__('Stock Entry submitted successfully: ' + submit_response.message.name));
                                    set_batch_no(frm, submit_response.message.name);
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            }
                        });
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    });
}

function set_batch_no(frm, name) {
    frappe.call({
        method: "get_submited_stock_entry",
        args: {
            stock_name: name
        },
        callback: function (get_response) {
            if (get_response.message && Array.isArray(get_response.message)) {
                let items_to_insert = [];

                frm.doc.items.forEach(function (row) {
                    get_response.message.forEach(function (item) {
                        if (item.item_code === row.item && item.qty == row.qty) {
                            frappe.model.set_value(row.doctype, row.name, "batch_no", item.batch_no);
                            frappe.model.set_value(row.doctype, row.name, "transfer_qty", item.transfer_qty);
                            frappe.model.set_value(row.doctype, row.name, "default_uom", item.stock_uom);
                            frappe.model.set_value(row.doctype, row.name, "conversion_factor", item.conversion_factor);
                            frappe.model.set_value(row.doctype, row.name, "stock_transfer_id", item.stock_entry_name);

                            items_to_insert.push({
                                item: row.item,
                                total_qty: item.transfer_qty,
                                balance_qty: item.transfer_qty,
                                uom: item.uom,
                                received_qty: "0",
                                service_for: row.server_for,
                                source_warehouse: row.target_warehouse
                            });
                        }
                    });
                });

                if (items_to_insert.length > 0) {
                    check_and_insert_dc_in(frm, items_to_insert);
                }

                frm.refresh_field("items");
            } else {
                frappe.msgprint(__('Failed to fetch Stock Entry details: ' + JSON.stringify(get_response.message)));
            }
        }
    });
}

function check_and_insert_dc_in(frm, items) {
    // Check if Service DC IN already exists for this DC OUT
    frappe.db.exists('Service DC IN', { dc_out_id: frm.doc.name }).then(exists => {
        if (exists) {
            console.log("Service DC IN already exists for this DC OUT. Skipping insertion.");
            return;
        } else {
            insert_dc_in(frm, items);
        }
    });
}

function insert_dc_in(frm, items) {
    get_company_by_user().then(company => {
        let id = "";

        if (!company) {
            frappe.throw(__('User company is not set. Please update your profile.'));
            return;
        }

        let series_map = {
            "REVURU FASTENERS PVT LTD": "RF-IDC/25-26/",
            "MVD FASTENERS PRIVATE LIMITED": "MV/IDC/25-26-",
            "REVURU PRECISION LLP": "RP-IDC/25-26/"
        };

        if (series_map[company]) {
            id = series_map[company];
        }

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "Service DC IN",
                    naming_series: id,
                    supplier: frm.doc.supplier,
                    dc_status: "Pending",
                    dc_out_id: frm.doc.name,
                    items: items
                }
            },
            callback: function (response) {
                if (response.message) {
                    frappe.msgprint(__('Service DC IN created: ' + response.message.name));
                } else {
                    frappe.msgprint(__('Failed to create Service DC IN'));
                }
            }
        });
    });
}

function get_company_by_user() {
    return frappe.db.get_list('Employee', {
        filters: {
            user_id: frappe.session.user
        },
        fields: ['company'],
        limit_page_length: 1
    }).then(result => {
        if (result && result.length > 0) {
            return result[0].company;
        } else {
            return null;
        }
    });
}




