frappe.ui.form.on('Sales Order', {
    before_save: function (frm) {
        if (!frm.doc.customer) return;        
        frm.doc.items.forEach(item => {
            console.log("item",item);
            if(item.custom_unit_rate > 0){
                frappe.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Item Price",
                        filters: {
                            item_code: item.item_code,
                            customer: frm.doc.customer,
                            price_list: frm.doc.selling_price_list
                        },
                        fieldname: ["name", "price_list_rate"]
                    },
                    callback: function (res) {
                        const price = res.message;
                        if (price && price.name) {
                            let lastPrice = parseFloat(price.price_list_rate);
                            if (lastPrice !== parseFloat(item.custom_unit_rate)) {
                                frappe.call({
                                    method: "frappe.client.set_value",
                                    args: {
                                        doctype: "Item Price",
                                        name: price.name,
                                        fieldname: {
                                            price_list_rate: item.custom_unit_rate
                                        }
                                    }
                                });
                                updateHistory(frm, item, lastPrice);
                            }
                        } else {
                            frappe.call({
                                method: "frappe.client.insert",
                                args: {
                                    doc: {
                                        doctype: "Item Price",
                                        item_code: item.item_code,
                                        customer: frm.doc.customer,
                                        price_list: frm.doc.selling_price_list,
                                        price_list_rate: item.custom_unit_rate,
                                        selling: 1
                                    }
                                }
                            });
                            updateHistory(frm, item, 0);
                        }
                    }
                });
            }            
        });
    }
});

function updateHistory(frm, item, lastRate) {
    frappe.call({
        method: "frappe.client.insert",
        args: {
            doc: {
                doctype: "Price Change History",
                item: item.item_code,
                user: frappe.session.user,
                customer: frm.doc.customer,
                rate: item.rate,
                last_rate: lastRate,
                date_time: frappe.datetime.now_date()
            }
        }
    });
}