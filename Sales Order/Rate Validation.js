frappe.ui.form.on('Sales Order Item', {
    rate: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        let customer = frm.doc.customer;

        // Ensure the validation runs only when the rate field is edited
        if (item.item_code && item.rate !== item.__last_rate) {
            console.log("Rate has changed for", item.item_code);

            item.__last_rate = item.rate;

            frappe.call({
                method: 'get_so_rate', // Replace with the correct path to your method
                args: {
                    item_code: item.item_code,
                    current_customer: customer
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        let data = r.message[0]; // Get the prioritized price
                        console.log("Fetched Price Data:", data);

                        // Validate the rate
                        if (item.rate < data.price_list_rate) {
                            frappe.msgprint({
                                title: __("Rate Validation"),
                                message: __(`The entered rate (${item.rate}) cannot allowed price (${data.price_list_rate}).`),
                                indicator: "red"
                            });

                            // Reset the rate to the allowed price
                            frappe.model.set_value(cdt, cdn, 'rate', data.price_list_rate);
                        }
                    } else {
                        console.log("No price data found for the item.");
                    }
                }
            });
        }
    }
});
