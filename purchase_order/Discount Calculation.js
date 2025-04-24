frappe.ui.form.on('Purchase Order Item', {
    item_code: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.rate) {
            setTimeout(function () {
                frappe.model.set_value(cdt, cdn, 'custom_unit_rate', row.rate);
            }, 500); // 500 milliseconds = 0.5 second delay
        }
    },

    custom_unit_rate: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        let rate = row.custom_unit_rate;
        frappe.model.set_value(cdt, cdn, 'rate', rate);
        frappe.model.set_value(cdt, cdn, 'custom_discount_percent', 0);
        frappe.model.set_value(cdt, cdn, 'custom_discount_amt', 0);
    },

    custom_discount_amt: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.rate > 0) {
            if(parseFloat(row.custom_discount_amt) > 0){
                let new_rate = row.rate - parseFloat(row.custom_discount_amt) || 0;            
                if (new_rate > 0) {
                    let dis_percent = row.rate/new_rate;
                    console.log("dp", dis_percent);
                    frappe.model.set_value(cdt, cdn, 'rate', new_rate);
                }
            }            
        }
    },

    custom_discount_percent: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.rate > 0) {
            let discount_percent = parseFloat(row.custom_discount_percent) || 0;
            if (discount_percent > 0) {
                let discount_amount = row.rate / 100 * discount_percent;
                let actual_rate = row.rate - discount_amount;
                actual_rate = parseFloat(actual_rate.toFixed(2));
                frappe.model.set_value(cdt, cdn, 'rate', actual_rate);
            }
        }
    }
});