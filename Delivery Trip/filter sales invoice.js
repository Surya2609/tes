frappe.ui.form.on('Delivery Stop', {
    custom_sales_invoice: function (frm) {
        frappe.call({
            method: 'filter_sales_invoice.sql', // Replace with the correct path to your method
            args: {
                company: frm.doc.company
            },
            callback: function (r) {
                console.log(r.message);
                let filteredNames = [];
                if (r.message && r.message.length > 0) {
                    filteredNames = r.message.map(item => item.name);
                }
                frm.set_query('custom_sales_invoice', function () {
                    if (filteredNames.length > 0) {
                        return {
                            filters: [
                                ['name', 'in', filteredNames]
                            ]
                        };
                    } else {
                        // Apply a filter that matches nothing
                        return {
                            filters: [
                                ['name', '=', '__none__'] // '__none__' is a non-existent value
                            ]
                        };
                    }
                });
            }
        });
    },
});