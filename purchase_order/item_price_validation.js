frappe.ui.form.on('Purchase Order Item', {
    // item_code: function (frm, cdt, cdn) {
    //     if(frm.doc.company == "MVD FASTENERS PRIVATE LIMITED"){
    //          let row = locals[cdt][cdn];
    //          console.log("row", row.item_code);
    //          console.log("row", row.uom);
    //     if (row.item_code ) {
    //         frappe.db.get_list('Item Price', {
    //             filters: {
    //                 item_code: row.item_code,
    //                 uom : row.uom,
    //                 price_list: frm.doc.buying_price_list
    //             },
    //             fields: ['price_list_rate', 'uom'],
    //             limit_page_length: 1
    //         }).then((result) => {
    //             console.log("resultssss", result);
    //             if (result.length != 0) {
    //                 price_list_rate = result[0].price_list_rate;
    //                 uom = result[0].uom;
    //                 console.log("getted", price_list_rate);
    //                 let value = parseFloat(price_list_rate) || 0;

    //                 if (value != 0) {
    //                     frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', value || 0);
    //                     // frappe.model.set_value(row.doctype, row.name, 'uom', uom);
    //                 }
    //             }
    //         });
    //     }
    //     }    
    // },

    // uom: function (frm, cdt, cdn) {
    //      if(frm.doc.company == "MVD FASTENERS PRIVATE LIMITED"){
    //     let row = locals[cdt][cdn];
    //     if (row.uom && row.item_code && frm.doc.buying_price_list) {
    //         frappe.db.get_list('Item Price', {
    //             filters: {
    //                 item_code: row.item_code,
    //                 uom: row.uom,
    //                 price_list: frm.doc.buying_price_list
    //             },
    //             fields: ['price_list_rate'],
    //             limit_page_length: 1
    //         }).then((result) => {
    //             console.log("resultssss", result);
    //             if (result.length != 0) {
    //                 price_list_rate = result[0].price_list_rate;
    //                 console.log("getted", price_list_rate);

    //                 let value = parseFloat(price_list_rate) || 0;

    //                 if (value != 0) {
    //                     frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', value || 0);
    //                 }
    //             }
    //         });
    //     }
    //      }
    // },

custom_unit_rate: function (frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    if (frm.doc.company === "MVD FASTENERS PRIVATE LIMITED") {
        let givenPrice = parseFloat(row.custom_unit_rate) || 0;

        if (row.item_code && row.uom && frm.doc.buying_price_list && givenPrice !== 0) {

            frappe.db.get_list('Item Price', {
                filters: {
                    item_code: row.item_code,
                    price_list: frm.doc.buying_price_list,
                    uom: row.uom
                },
                fields: ['price_list_rate', 'supplier'],
                limit_page_length: 10 // increased to fetch more options
            }).then((result) => {
                console.log("Item Price Results:", result);

                if (result.length > 0) {
                    // First try to find matching supplier
                    let match = result.find(item => item.supplier === frm.doc.supplier);

                    // If match found, use it; else fallback to first available
                    let priceEntry = match || result[0];
                    let value = parseFloat(priceEntry.price_list_rate) || 0;

                    if (value !== 0 && givenPrice > value) {
                        frappe.msgprint("Entered price exceeds allowed price from Item Price master. Reverting.");
                        frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', value);
                    }

                } else {
                    frappe.msgprint("Set Item Price in master before entering rate.");
                    frappe.model.set_value(row.doctype, row.name, 'custom_unit_rate', 0);
                }
            });
        }
    }
}

});

