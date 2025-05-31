frappe.ui.form.on('Purchase Receipt', {
    onload: function (frm) {
        if (frm.doc.is_return) {
            frm.doc.items.forEach((item, index) => {
                frappe.call({
                    method: 'get_por_batch_no',
                    args: {
                        pr_name: frm.doc.name,
                        item_code: item.item_code
                    },
                    callback: function (r) {
                        if (r.message && r.message.length > 0) {
                            let data = r.message;
                            // Update specific row safely using locals
                            let row = locals[item.doctype][item.name];
                            row.use_serial_batch_fields = 1;
                            row.batch_no = data[0].batch_no;

                            frm.refresh_field("items"); // refresh full child table
                        }
                    }
                });
            });
        }
    }
});
