frappe.ui.form.on('Calibration', {
    description: function (frm, cdt, cdn) {
        frappe.call({
            method: "get_calibration_varient_filter",
            args: {
                parent_group: frm.doc.description,
            },
            callback: function (r) {
                let filteredNames = [];
                if (r.message && r.message.length > 0) {
                    filteredNames = r.message.map(item => item.name);
                }
                frm.set_query('variants', function () {
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
            },
        });
    }
});