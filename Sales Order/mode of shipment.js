frappe.ui.form.on('Sales Order', {
    custom_mode_of_shipment: function (frm) {
        console.log("invoke");
        
        if(frm.doc.custom_mode_of_shipment == "By road") {
            frm.set_value("custom_mode_of_shipment", "");
        }else {
             if (frm.doc.custom_mode_of_shipment) {
            toggle_vehicle_field(frm);
        }
        }
        
       

    },
    onload: function (frm) {
        if (frm.is_new()) {
            frm.set_df_property('custom_payment', 'hidden', 1);
            frm.set_df_property('custom_type', 'hidden', 1);
            frm.set_df_property('custom_godown_name', 'hidden', 1);
        }
    }
});

function toggle_vehicle_field(frm) {
    frappe.db.get_list('Mode Of Shipment', {
        filters: {
            name: frm.doc.custom_mode_of_shipment
        },
        fields: ['is_pay', 'is_travel', 'is_godown'],
        limit_page_length: 1
    }).then((result) => {
        console.log("rm", result[0]);

        let value = result[0];
        
let payHidden = value.is_pay === 1 ? 0 : 1;
let travelHidden = value.is_travel === 1 ? 0 : 1;
let godownHidden = value.is_godown === 1 ? 0 : 1;


        if (result && result.length > 0) {

            frm.set_df_property('custom_payment', 'hidden', payHidden);
            frm.set_df_property('custom_type', 'hidden', travelHidden);
            frm.set_df_property('custom_godown_name', 'hidden', godownHidden);

        }
    });
}