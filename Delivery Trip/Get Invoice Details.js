frappe.ui.form.on('Delivery Stop', {
    custom_sales_invoice: function (frm, cdt, cdn) {
        console.log("invoked");
        let row = locals[cdt][cdn];
        if (row.delivery_note) {
            frappe.msgprint(__('Delivery Note is Selected'));
        } else {
            frappe.call({
                method: 'get_single_invoice_detl',
                args: { company: frm.doc.company, invoice_name: row.custom_sales_invoice },
                callback: function (r) {
                    console.log("sig res", r.message);
                    if (r.message) {
                        let data = r.message;
                        updateFieldsDT(data, row);
                    }
                }
            });
        }
    },
});

function updateFieldsDT(data, row) {
    let value = data[0];
    console.log("cust name",value.customer_name);
    frappe.model.set_value(row.doctype, row.name, 'custom_total_qty', value.total_qty || '');
    // frappe.model.set_value(row.doctype, row.name, 'customer', value.customer || '');
    frappe.model.set_value(row.doctype, row.name, 'contact', value.customer_name || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_document_date', value.posting_date || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_sales_person_id', value.sales_contact || '');
    frappe.model.set_value(row.doctype, row.name, 'custom_sales_contact_no', value.contact_no_1 || '');
    if (value.custom_invoice_shipping_address) {
        frappe.model.set_value(row.doctype, row.name, 'custom_invoice_shipping_address', value.custom_invoice_shipping_address || '');
    } else {
        frappe.model.set_value(row.doctype, row.name, 'custom_invoice_shipping_address', value.shipping_address || '');
    }
}