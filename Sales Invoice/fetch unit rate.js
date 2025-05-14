frappe.ui.form.on('Sales Invoice', {
    refresh: function (frm) {
        if (frm.is_new()) {
            frm.doc.items.forEach(item => {
                console.log("i a so", item);
                console.log("i a so", item.sales_order);
                if (item.sales_order) {
                    // frappe.call({
                    //     method: 'get_so_item_details', // update path
                    //     args: {
                    //         parent: row.so_name,
                    //         item_code: row.item_code
                    //     }
                    // }).then((r) => {
                    //     const result = r.message;
                    //     if (result && result.length > 0) {
                        
                        
                    //     }});




                    frappe.db.get_list('Sales Order Item', {
                        filters: {
                            parent: item.sales_order
                        },
                        fields: ['item_code', 'custom_unit_rate', 'parent', 'custom_discount_percent', 'custom_discount_amt'],
                        limit_page_length: 1
                    }).then((result) => {
                        console.log("rm", result[0]);
                        if (result && result.length > 0) {
                            console.log("u r", result[0].custom_unit_rate);
                            console.log("item_code:", result[0].item_code);
                            console.log("parent:", result[0].parent);

                            if (result[0].custom_unit_rate) {
                                frappe.model.set_value(item.doctype, item.name, 'custom_unit_rate', result[0].custom_unit_rate);
                                frappe.model.set_value(item.doctype, item.name, 'custom_discount_percent', result[0].custom_discount_percent);
                                frappe.model.set_value(item.doctype, item.name, 'custom_discount_amt', result[0].custom_discount_amt);
                            }
                        }
                    });
                }

            })
        }
    }
})