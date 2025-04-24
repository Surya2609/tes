frappe.ui.form.on('Calibration', {
    variants: function (frm) {
        if (frm.doc.variants) {
            console.log('Selected Variant:', frm.doc.variants);

            frappe.call({
                method: 'get_variant_details',  // Replace with the correct path to your server-side method
                args: {
                    variant_name: frm.doc.variants  // Pass the variant name
                },
                callback: function (r) {
                    if (r.message) {
                        console.log('Fetched Data:', r.message);
                                              
                        frappe.model.set_value(frm.doctype, frm.docname, 'make', r.message[0].make);  // Set the make field
                        frappe.model.set_value(frm.doctype, frm.docname, 'serial_number', r.message[0].serial_number);  
                        frappe.model.set_value(frm.doctype, frm.docname, 'instrument_id', r.message[0].instrument_id);
                        frappe.model.set_value(frm.doctype, frm.docname, 'least_count', r.message[0].least_count);// Set the serial_number field
                    } else {
                        frappe.msgprint(__('No data found for the selected Variant.'));
                    }
                },
                error: function (err) {
                    console.error('Error:', err);
                    frappe.msgprint(__('An error occurred while fetching data. Please check the console for more details.'));
                }
            });

        } else {
            console.log('No Variant selected.');
        }
    }
});
