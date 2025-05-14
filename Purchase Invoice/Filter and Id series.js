    frappe.ui.form.on('Purchase Invoice', {
        onload: function (frm) {
            if (frm.is_new()) {
                apply_series_filter(frm);
           }   
        },

    });

    function apply_series_filter(frm) {
        frappe.db.get_list('Employee', {
            filters: {
                user_id: frappe.session.user
            },
            fields: ['company'],
            limit_page_length: 1
        }).then((result) => {
            console.log("res", result);
            company = result[0].company;

            let series_map = {
                "REVURU FASTENERS PVT LTD": "PI-RF-.YY.-",
                "MVD FASTENERS PRIVATE LIMITED": "PI/MV/25-26-"
            };

            if (series_map[company]) {
                frm.set_value("naming_series", series_map[company]);
                frm.set_value("company", company);
            }
        });
    }