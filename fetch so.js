frappe.ui.form.on('Admin', {
    select_so: function (frm) {
        frappe.call({
            method: "fetch",
            args: {
                so: frm.doc.so
            },
            callback: function (get_response) {
                console.log("Batch Nos:", get_response.message);
                frm.set_value("text", get_response.message[0].address_display);
            }
        });       
    },
});