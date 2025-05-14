frappe.ui.form.on('Payment Emtry', {
    party: function (frm) {
        frappe.call({
            method: "get_cust_total_outstanding",
            args: {
                customer: frm.doc.party,
                company: frm.doc.company
            },
            callback: function (r) {
                console.log("r mess", r.message);
                let total_outstanding = r.message[0].total_outstanding_balance;
                frm.set_value("paid_amount", total_outstanding);
            },
        });
    }
});