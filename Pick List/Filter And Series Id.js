frappe.ui.form.on('Pick List', {
    onload: function (frm) {
        frm.set_value("purpose", "Delivery");
        if (frm.is_new()) {
            apply_series_filter_and_warehouse(frm);
       }         
    },
});

function apply_series_filter_and_warehouse(frm) {
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
            "REVURU FASTENERS PVT LTD": "PL-RF-.YY.-",
            "MVD FASTENERS PRIVATE LIMITED": "PL-MV-25-26-"
        };

        if(company == "MVD FASTENERS PRIVATE LIMITED"){
            frm.set_value("parent_warehouse", "All Warehouses - MFPL");
        }else{
            frm.set_value("parent_warehouse", "All Warehouses - RFPL");
        }


        if (series_map[company]) {
            frm.set_value("naming_series", series_map[company]);
            frm.set_value("company", company);
        }
    });
}
