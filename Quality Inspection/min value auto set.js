frappe.ui.form.on('Quality Inspection', {
    items_add: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        console.log("✅ New item added:", row);
        
        // Example: Set a default value
        frappe.model.set_value(cdt, cdn, 'some_field', 'Default Value');
    },
    onload: function (frm) {
        console.log("ic",frm.doc.item_code);
        if(frm.doc.item_code && frm.doc.readings?.length){
            console.log("invoked");
            frm.doc.readings?.forEach(item => {
                console.log("line", item);
                frappe.model.set_value(item.doctype, item.name, 'custom_item', frm.doc.item_code);
            });
        }      
    },

    before_save: function (frm) {
        frm.doc.readings?.forEach(item => {
            set_auto_max_value_onrefresh(frm, item);
        });
    },
});

function set_auto_max_value_onrefresh(frm, item) {
    let maxVal = parseFloat(item.max_value) || 0;

    let readings = [
        parseFloat(item.reading_1) || 0,
        parseFloat(item.reading_2) || 0,
        parseFloat(item.reading_3) || 0,
        parseFloat(item.reading_4) || 0,
        parseFloat(item.reading_5) || 0,
    ];

    let max_value = Math.max(...readings);
    let min_value = Math.min(...readings);

    frappe.model.set_value(item.doctype, item.name, 'custom_reading_max', max_value);
    frappe.model.set_value(item.doctype, item.name, 'custom_reading_min', min_value);

    if (maxVal === 0) {
        frappe.model.set_value(item.doctype, item.name, 'max_value', max_value);
    }
}