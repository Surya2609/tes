frappe.ui.form.on('Delivery Stop', {
    delivery_note: function (frm) {
        console.log("invoked");
        let row = locals[cdt][cdn];
        console.log("p date",row.posting_date);
        frappe.db.get_list('Delivery Note', {
            filters: {
                name: row.delivery_note
            },
            fields: ['name', 'posting_date'],
            limit_page_length: 1
        }).then((result) => {
            console.log("rm", result[0]);
            frm.set_value("custom_document_date", result[0].posting_date);
        });        
    },
})