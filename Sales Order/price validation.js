frappe.ui.form.on('Sales Order Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        frappe.db.get_list('Item Price', {
            filters: {
                item_code: row.item_code,
                price_list: frm.doc.buying_price_list
            },
            fields: ['price_list_rate'],
            limit_page_length: 1
        }).then((result) => {
            console.log("resultssss", result);
            price_list_rate = result[0].price_list_rate;
            console.log("getted", price_list_rate);

            let value = parseFloat(price_list_rate) || 0;
            if (value != 0) {
                frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', value || 0);
            }
        });
    },

    custom_unit_rate: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        let givenPrice = parseFloat(row.custom_unit_rate) || 0;

        if (givenPrice != 0) {

            frappe.db.get_list('Item Price', {
                filters: {
                    item_code: row.item_code,
                    price_list: frm.doc.buying_price_list
                },
                fields: ['price_list_rate'],
                limit_page_length: 1
            }).then((result) => {
                console.log("res", result);
                price_list_rate = result[0].price_list_rate;

                let value = parseFloat(price_list_rate) || 0;
                if (value != 0) {
                    if (givenPrice > value) {
                        frappe.msgprint("Validation Cannot Able To Change Price");                        
                        frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', value || 0);
                    }
                }
            });

        }
    }
});