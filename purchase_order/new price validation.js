
frappe.ui.form.on('Purchase Order Item', {
    rate: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];
    
        frappe.call({
            method: 'get_po_rate', // Replace with the correct path to your method
            args: {
                item_code: item.item_code              
            },
            callback: function (r) {
                if (r.message && r.message.length > 0) {
                    let data = r.message[0];
                    console.log("Fetched Price Data:", data);

                    if (data.conversion_factor == null) {
                        console.log("it", item);                    
                        // if (item.rate > data.price_list_rate) {
                        //     frappe.msgprint({
                        //         title: __("Rate Validation"),
                        //         message: __(`The entered rate (${item.rate}) cannot exceed the allowed price (${data.price_list_rate}).`),
                        //         indicator: "red"
                        //     });

                        //     frappe.model.set_value(cdt, cdn, 'rate', data.price_list_rate);
                        // }
                    }
                    else if (data.conversion_factor != null && item.uom) {

                        let originalPrice = 0;
                        let price = data.price_list_rate || 0;
                        let c_f = data.conversion_factor || 0;
                        originalPrice = c_f * price;
                        console.log("originalPrice", originalPrice);
                        
                    }
                } else {
                    console.log("No price data found for the item.");
                }
            }
        });

    }});