frappe.ui.form.on('Delivery Note', {
    onload: function (frm) {
        if(frm.is_new()) {
            frm.doc.items.forEach(item => {
                if (item.against_sales_order) {
                    frappe.db.get_list('Sales Order Item', {
                        filters: {
                            parent: item.against_sales_order
                        },
                        fields: ['item_code', 'custom_unit_rate', 'parent'],
                        limit_page_length: 1
                    }).then((result) => {
                        console.log("rm", result[0]);
                        if (result && result.length > 0) {
                            console.log("u r", result[0].custom_unit_rate);
                            console.log("item_code:", result[0].item_code);
                            console.log("parent:", result[0].parent);
    
                            if (result[0].custom_unit_rate) {
                                frappe.model.set_value(item.doctype, item.name, 'custom_unit_rate', result[0].custom_unit_rate);
                            }
                        }
                    });
                }
    
            })
        }
        
    }
})