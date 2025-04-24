frappe.ui.form.on('Item', {
    custom_parent_group: function (frm) {
        frappe.call({
            method: 'get_filtered_sub_group_1', // Replace with the correct path to your method
            args: {
                parent_group: frm.doc.custom_parent_group
            },
            callback: function (r) {
                console.log(r.message);
                let filteredNames = [];
                if (r.message && r.message.length > 0) {
                    filteredNames = r.message.map(item => item.name);
                }
                frm.set_query('custom_sub_group_1', function () {
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
        if (frm.doc.custom_parent_group) {
            frappe.model.set_value(frm.doc.doctype, frm.doc.name, 'custom_sub_group_1', "");
        }
    },

    custom_sub_group_1: function (frm) {
        frappe.call({
            method: 'get_filtered_sub1_group',
            args: {
                parent_group: frm.doc.custom_sub_group_1
            },
            callback: function (r) {
                let filteredNames = [];
                if (r.message && r.message.length > 0) {
                    filteredNames = r.message.map(item => item.name);
                }
                frm.set_query('custom_sub_group_2', function () {
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

        if (frm.doc.custom_sub_group_1) {
            frappe.model.set_value(frm.doc.doctype, frm.doc.name, 'custom_sub_group_2', "");
        }
    },

    custom_sub_group_2: function (frm) {
        frappe.call({
            method: 'get_filtered_sub2_group', // Replace with the correct path to your method
            args: {
                parent_group: frm.doc.custom_sub_group_2
            },
            callback: function (r) {
                console.log(r.message);
                let filteredNames = [];
                if (r.message && r.message.length > 0) {
                    filteredNames = r.message.map(item => item.name);
                }

                frm.set_query('custom_sub_group_3', function () {
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
        if (frm.doc.custom_sub_group_2) {
            frappe.model.set_value(frm.doc.doctype, frm.doc.name, 'custom_sub_group_3', "");
        }
    },
});