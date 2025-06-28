$(function () {
    $(document).on("click", ".kot-create", function () {
        const btn = $(this);
        const so = btn.data("so");
        const item = btn.data("item");
        const item_name = btn.data("name");
        const c_f = btn.data("conversion_factor");

        const so_uom = btn.data("so_uom");        
        const base_uom = btn.data("base_uom");

        const so_qty = parseFloat(btn.data("so_qty")) || 0;
        const pick_qty_to_add = parseFloat(btn.data("kot_qty")) || 0; // ✅ renamed to avoid conflict
        const so_remaning = parseFloat(btn.data("so_remaning")) || 0;
        const status = btn.data("status") || '';

        // ❌ Block if no stock to pick
        if (pick_qty_to_add <= 0) {
            frappe.msgprint("❌ No stock available. KOT Report not created.");
            return;
        }

        // ✅ Proceed only if there is stock to pick
        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "KOT Report",
                filters: {
                    sales_order: so,
                    item_code: item
                },
                fields: ["name", "pick_qty", "kot_qty"]
            },
            callback: function (res) {
                if (res.message && res.message.length > 0) {
                    const existing = res.message[0];
                    const updated_pick_qty = parseFloat(existing.pick_qty || 0) + pick_qty_to_add;
                    const updated_kot_qty = parseFloat(existing.kot_qty || 0) + pick_qty_to_add;

                    frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: "KOT Report",
                            name: existing.name,
                            fieldname: {
                                pick_qty: updated_pick_qty,
                                kot_qty: updated_kot_qty
                            }
                        },
                        callback: function () {
                            frappe.msgprint(`🔁 Updated existing KOT Report: ${existing.name}`);
                        }
                    });

                } else {
                    // ✅ Insert new KOT Report


                    

                    frappe.call({
                        method: "frappe.client.insert",
                        args: {
                            doc: {
                                doctype: "KOT Report",
                                sales_order: so,
                                item_code: item,
                                so_uom: so_uom,
                                base_uom : base_uom,
                                convertion_factor : c_f,
                                item_name: item_name,
                                so_qty: so_qty,
                                pick_qty: pick_qty_to_add,
                                kot_qty: pick_qty_to_add,
                                so_remaning: so_remaning,
                                status: status
                            }
                        },
                        callback: function (r) {
                            frappe.msgprint(`✅ New KOT Report created: ${r.message.name}`);
                        }
                    });
                }
            }
        });
    });
});
