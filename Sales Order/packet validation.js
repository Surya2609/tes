frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item_code) {

            if (frm.doc.custom_is_premium) {
                console.log("is premium");
            } else {
                console.log(" not is premium");
                frappe.call({
                    method: "get_item_packet_qty",
                    args: {
                        item: row.item_code
                    },
                    callback: function (get_response) {
                        if (get_response.message && Array.isArray(get_response.message)) {
                            console.log("results s", get_response.message);
                            let packetDataNos = get_response.message[0].custom_1_packet_qty_nos || 0;
                            let packetDataKg = get_response.message[0].custom_1_packet_qty_kg || 0;
                            let defaultuom = get_response.message[0].stock_uom;

                            if (defaultuom) {
                                if (defaultuom == "Nos") {
                                    if (packetDataNos != 0) {
                                        frappe.model.set_value(cdt, cdn, "qty", packetDataNos);
                                    }
                                } else if (defaultuom == "Kg") {
                                    if (packetDataKg != 0) {
                                        frappe.model.set_value(cdt, cdn, "qty", packetDataKg);
                                    }
                                }
                            }
                        }
                    },
                });
            }

        }
    },

    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.item_code) {

            if (frm.doc.custom_is_premium) {
                console.log("is premium");
            } else {
                console.log(" not is premium");
                frappe.call({
                    method: "get_item_packet_qty",
                    args: {
                        item: row.item_code,
                    },
                    callback: function (get_response) {
                        if (get_response.message && Array.isArray(get_response.message)) {
                            console.log("results s", get_response.message);
                            let packetDataNos = get_response.message[0].custom_1_packet_qty_nos || 0;
                            let packetDataKg = get_response.message[0].custom_1_packet_qty_kg || 0;
                            if (row.qty != 0) {
                                if (row.uom == "Nos") {
                                    if (packetDataNos != 0) {
                                        multipliesNos = row.qty % packetDataNos;
                                        if (multipliesNos != 0) {
                                            frappe.model.set_value(cdt, cdn, "qty", "");
                                            frappe.throw(`Item ${row.item_code}: Qty must be multiple of ${packetDataNos}`);
                                        }
                                    }
                                } else if (row.uom == "Kg") {
                                    if (packetDataKg != 0) {
                                        multipliesKg = row.qty % packetDataKg;
                                        if (multipliesKg != 0) {
                                            frappe.model.set_value(cdt, cdn, "qty", "");
                                            frappe.throw(`Item ${row.item_code}: Qty must be multiple of ${packetDataNos}`);
                                        }
                                    }
                                }
                            }
                        }
                    },
                });
            }
        }
    },

    validate: function (frm) {
        console.log("invokinggggg");

        if (frm.doc.custom_is_premium) {
            console.log("is premium");
        } else {
            (frm.doc.items || []).forEach(function (row) {
                if (row.item_code) {
                    frappe.call({
                        method: "get_item_packet_qty",
                        args: { item: row.item_code },
                        async: false,  // Make it synchronous (use with caution)
                        callback: function (get_response) {
                            if (get_response.message && Array.isArray(get_response.message)) {
                                let packetDataNos = get_response.message[0].custom_1_packet_qty_nos || 0;
                                let packetDataKg = get_response.message[0].custom_1_packet_qty_kg || 0;
                                if (row.qty != 0) {
                                    if (row.uom == "Nos" && packetDataNos != 0 && row.qty % packetDataNos != 0) {
                                        frappe.model.set_value(cdt, cdn, "qty", "");
                                        frappe.throw(`Item ${row.item_code}: Qty must be multiple of ${packetDataNos}`);
                                    }
                                    if (row.uom == "Kg" && packetDataKg != 0 && row.qty % packetDataKg != 0) {
                                        frappe.model.set_value(cdt, cdn, "qty", "");
                                        frappe.throw(`Item ${row.item_code}: Qty must be multiple of ${packetDataKg}`);
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }

    }
});