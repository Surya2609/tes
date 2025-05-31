frappe.ui.form.on('Delivery Trip', {
    driver: function (frm) {
        if (frm.is_new()) {
            frappe.db.get_list('Driver', {
                filters: {
                    name: frm.doc.driver
                },
                fields: ['cell_number'],
                limit_page_length: 1
            }).then((result) => {
                console.log("res", result);
                phoen_no = result[0].cell_number;
                frm.set_value("custom_phone_no", phoen_no);

            });
        }
    },
});