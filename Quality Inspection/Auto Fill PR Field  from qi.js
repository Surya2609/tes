frappe.ui.form.on("Quality Inspection", {
    before_submit: function (frm) {
        return new Promise((resolve, reject) => {
            if (frm.doc.reference_type === "Purchase Receipt" && frm.doc.reference_name) {
                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Purchase Receipt",
                        name: frm.doc.reference_name,
                    },
                    callback: function (response) {
                        if (!response.message) {
                            frappe.msgprint("Could not load Purchase Receipt.");
                            return reject();
                        }

                        let purchase_receipt = response.message;

                        function proceedWithWarehouses(wip, rji) {
                            purchase_receipt.items.forEach((item) => {
                                if (item.item_code === frm.doc.item_code) {
                                    if (
                                        frm.doc.status === "Accepted" &&
                                        frm.doc.custom_is_deviation === "YES"
                                    ) {
                                        item.warehouse = wip;
                                        item.custom_is_deviated = "YES";                                        
                                    } else if (frm.doc.status === "Rejected") {
                                        item.custom_is_deviated = "RJI";
                                        item.warehouse = rji;
                                    }
                                }
                            });

                            frappe.call({
                                method: "frappe.client.save",
                                args: { doc: purchase_receipt },
                                callback: function () {
                                    frappe.msgprint(__("Purchase Receipt updated successfully."));
                                    resolve(); // ✅ Allow submit to continue
                                },
                            });
                        }

                        getDefaultCompanyWarehouses(frappe.session.user)
                            .then((warehouses) => {
                                console.log("ware", warehouses);
                                const wip = warehouses[0]?.custom_work_in_process;
                                const rji = warehouses[0]?.custom_rejected_item;

                                console.log("w", wip);
                                console.log("r", rji);

                                if (wip && rji) {
                                    proceedWithWarehouses(wip, rji);
                                } else {
                                    showWarehouseDialog(); // only show if missing
                                }
                            })
                            .catch((err) => {
                                console.error("Error getting warehouse info:", err);
                                showWarehouseDialog(); // only on actual API failure
                            });

                    },
                });
            } else {
                resolve(); // ✅ Continue with submit if condition not matched
            }
        });
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



function showWarehouseDialog() {
    let d = new frappe.ui.Dialog({
        title: "Select Warehouses",
        fields: [
            {
                label: "Work In Progress Warehouse",
                fieldname: "work_in_progress",
                fieldtype: "Link",
                options: "Warehouse",
                reqd: 1,
            },
            {
                label: "Rejected Items Warehouse",
                fieldname: "rejected_warehouse",
                fieldtype: "Link",
                options: "Warehouse",
                reqd: 1,
            },
        ],
        primary_action_label: "Submit",
        primary_action(values) {
            d.hide();
            proceedWithWarehouses(
                values.work_in_progress,
                values.rejected_warehouse
            );
        },
        secondary_action_label: "Cancel",
        secondary_action() {
            d.hide();
        },
    });
    d.show();
}

