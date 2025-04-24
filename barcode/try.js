frappe.ui.form.on('Service DC OUT', {
    supplier: function (frm) {
        
        //// this i s tested purpose 
        frappe.prompt([
            {
                label: 'Item Code',
                fieldname: 'item_code',
                fieldtype: 'Link',
                options: 'Item',
                reqd: 1
            },
            {
                label: 'Warehouse',
                fieldname: 'warehouse',
                fieldtype: 'Link',
                options: 'Warehouse',
                reqd: 1
            }
        ],
        function (values) {
            // Call the function with selected values
            get_batch_nos_for_item(values.item_code, values.warehouse);
        },
        __('Select Item and Warehouse'),
        __('OK'));
    },
});

function get_batch_nos_for_item(item_code, warehouse) {
    frappe.call({
        method: "get_item_batch_no",
        args: {
            item_code: item_code,
            warehouse: warehouse
        },
        callback: function (get_response) {
            console.log("Batch Nos:", get_response.message);
            frappe.msgprint(__('Batch Nos: ' + JSON.stringify(get_response.message)));
        }
    });
}
