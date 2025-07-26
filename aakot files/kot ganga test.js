    frappe.query_reports["KAVERI"] = {
        filters: [
            {
                fieldname: "company",
                label: "Company",
                fieldtype: "Link",
                options: "Company",
                reqd: 1,
                default: "MVD FASTENERS PRIVATE LIMITED",
            },
            {
                fieldname: "warehouse",
                label: "Warehouse",
                fieldtype: "Link",
                options: "Warehouse",
                reqd: 1,
                default: "All Warehouses - MVDF",
                get_query: function (doc) {
                    const company = frappe.query_report.get_filter_value("company");
                    return {
                        filters: {
                            company: company,
                            is_group: 1 // Only show parent (group) warehouses
                        }
                    };
                }
            }
        ],

        onload: function(report) {
            report.page.add_inner_button('🟩 Available Stock', function() {
                report.set_filter_value('stock_status', 'Available');
                report.refresh();
            });

            report.page.add_inner_button('🟨 Partial Stock', function() {
                report.set_filter_value('stock_status', 'Partial');
                report.refresh();
            });

            report.page.add_inner_button('🟥 No Stock', function() {
                report.set_filter_value('stock_status', 'None');
                report.refresh();
            });
        },

        formatter: function (value, row, column, data, default_formatter) {
            value = default_formatter(value, row, column, data);

            if (column.fieldtype === "HTML") {
                return value;
            }

            const pending = data["dn_current_pending_qty"] || 0;
            const to_pick = data["to_pick_qty"] || 0;
            const platting = data["platting_stock_qty"] || 0;
            const available = data["available_stock"] || 0;

            let bg = "";

            if (to_pick === 0 && platting > 0 && available === 0) {
                bg = "#cce5ff"; // blue
            } else if (to_pick === 0) {
                bg = "#ffcccc"; // red
            } else if (pending > to_pick) {
                bg = "#ffe5b4"; // orange
            } else {
                bg = "#1a761aff"; // green
            }

            return `<span style="display:block;padding-left:5px;background-color:${bg}!important;">${value}</span>`;
        },

        // formatter: function (value, row, column, data, default_formatter) { 
        //     value = default_formatter(value, row, column, data);

        //     // Skip HTML fields (buttons etc.)
        //     if (column.fieldtype === "HTML") {
        //         return value;
        //     }

        //     const pending = data["dn_current_pending_qty"];
        //     const to_pick = data["to_pick_qty"];

        //     // If pending or to_pick is undefined, fallback to default
        //     if (pending === undefined || to_pick === undefined) {
        //         return value;
        //     }

        //     let bg = "";

        //     if (to_pick === 0 && (data.platting_stock_qty || 0) > 0) {
        //         bg = "#cce5ff"; // blue (KOT stock available in Picking - MVDF group)
        //     } else if (to_pick === 0) {
        //         bg = "#ffcccc"; // red (no stock anywhere)
        //     } else if (pending > to_pick) {
        //         bg = "#ffe5b4"; // orange
        //     } else {
        //         bg = "#1a761aff"; // green
        //     }

        //     return `<span style="display:block;padding-left:5px;background-color:${bg}!important;">${value}</span>`;
        // },
        
        // after_datatable_render: function () {
        //     $('.kot-create').on('click', function () {
        //         const so = $(this).data('so');
        //         const item = $(this).data('item');
        //         frappe.msgprint(`Button is pressed for SO: ${so}, Item: ${item}`);
        //     });
        // },
    };