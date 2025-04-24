frappe.ui.form.on('Sales Order Item', {
    custom_customer_part_code: function (frm, cdt, cdn) {
    
        console.log("Current user:", frappe.session.user);
        let item = locals[cdt][cdn];
        
        console.log("cu",frm.doc.customer);
        console.log("cup",frm.doc.custom_customer_part_code);
        
        if (frm.doc.customer && item.custom_customer_part_code) {
            frappe.call({
                method: 'get_customer_part',
                args: {
                    customer_part_code: item.custom_customer_part_code,
                    customer: frm.doc.customer
                },
                callback: function (r) {
                    console.log("r me",r.message);
                    if (r.message) {
                        let data = r.message;         
                        console.log("data", data);
                        if (data.length != 0 && data[0].item != null) {
                            frappe.model.set_value(item.doctype, item.name, 'item_code', data[0].item);
                            frappe.model.set_value(item.doctype, item.name, 'custom_customer_description', data[0].customer_description);
                            
                        }else{
                            frappe.model.set_value(item.doctype, item.name, 'item_code', null);
                            frappe.model.set_value(item.doctype, item.name, 'custom_customer_description', null);
                        }
                    }
                }
            });
        }
    },

    item_code: function (frm, cdt, cdn) {
        let item = locals[cdt][cdn];  // Correctly fetch the child table row
        console.log("cust",frm.doc.customer);
        console.log("i code",item.item_code);

if(frm.set_warehouse){
    frappe.model.set_value(item.doctype, item.name, 'warehouse', frm.set_warehouse);
}


        if (frm.doc.customer && item.item_code) {
            frappe.call({
                method: 'get_customer_part',  // Replace with the correct path to your method
                args: {
                    item_code: item.item_code,
                    customer: frm.doc.customer
                },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;  // Assign response to 'data'
                        console.log("data", data);
                            if (data.length != 0 && data[0].customer_part_code != null) {
                                frappe.model.set_value(item.doctype, item.name, 'custom_customer_part_code', data[0].customer_part_code);
                                frappe.model.set_value(item.doctype, item.name, 'custom_customer_description', data[0].customer_description);
                            }else{
                                frappe.model.set_value(item.doctype, item.name, 'custom_customer_part_code', null);
                                frappe.model.set_value(item.doctype, item.name, 'custom_customer_description', null);
                            }                                             
                    }
                }
            });
        }
    }
});
