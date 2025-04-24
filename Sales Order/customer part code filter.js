frappe.ui.form.on('Sales Order', {
    refresh: function (frm) {
        frm.fields_dict["items"].grid.get_field("custom_customer_part_code").get_query = function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    customer_name: frm.doc.customer // Filter based on selected Customer in Sales Order
                }
            };
        };
    }
});
