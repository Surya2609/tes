frappe.ui.form.on('Purchase Order', {
    onload: function(frm) {
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
            "REVURU FASTENERS PVT LTD": "RF-PO-.YY.-",
            "MVD FASTENERS PRIVATE LIMITED": "MV/PO/25-26-"
        };

        if (series_map[company]) {
            frm.set_value("naming_series", series_map[company]);
            frm.set_value("company", company);
        }

        if(company) {
            set_priceList(frm, company);
        }
    });
}


function set_priceList(frm, company) {
    frappe.db.get_list('Company', {
        filters: {
            name: company
        },
        fields: ['custom_default_buying_', 'custom_default_selling'],
        limit_page_length: 1
    }).then((result) => {
        console.log("res", result);

        if(result.length != 0) {
            let buyingPrice = result[0].custom_default_buying_;
            let sellingPrice = result[0].custom_default_selling;        
            if (buyingPrice) {
                frm.set_value("buying_price_list", buyingPrice);
            }
        }

    });
}