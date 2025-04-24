frappe.ui.form.on('Sales Order', {
    onload: function (frm) {
        if (frm.is_new()) {
            apply_series_filter(frm);

            getDefaultCompanyWarehouses(frappe.session.user)
                .then((warehouses) => {
                    console.log("ware", warehouses);
                    const goodWarehouse = warehouses[0]?.custom_default_good_parent;
                    
                    console.log("g warehouse", goodWarehouse);

                    if (goodWarehouse) {
                        frm.set_value("set_warehouse", goodWarehouse);
                    }
                })
                .catch((err) => {
                    console.error("Error getting warehouse info:", err);
                    showWarehouseDialog(); // only on actual API failure
                });

        }
    },
});

function getDefaultCompanyWarehouses(user) {
    return new Promise((resolve, reject) => {
        frappe.call({
            method: "get_default_company_warehouses",
            args: { user: user },
            callback: function (response) {
                const data = response.message;
                if (data && Array.isArray(data) && data.length > 0) {
                    resolve(data);
                } else {
                    reject("No data found for the user.");
                }
            },
            error: function (err) {
                reject(err);
            },
        });
    });
}

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
            "REVURU FASTENERS PVT LTD": "SO-RF-.YY.-",
            "MVD FASTENERS PRIVATE LIMITED": "SO-MV-25-26-"
        };

        if (series_map[company]) {
            frm.set_value("naming_series", series_map[company]);
            frm.set_value("company", company);
        }



        if (company) {
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

        if (result.length != 0) {
            let buyingPrice = result[0].custom_default_buying_;
            let sellingPrice = result[0].custom_default_selling;
            if (sellingPrice) {
                frm.set_value("selling_price_list", sellingPrice);
            }
        }

    });
}