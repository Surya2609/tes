frappe.ui.form.on('Purchase Invoice Item', {
    custom_convert_rate: function (frm, cdt, cdn) {

        let item = locals[cdt][cdn];

        let cf = parseFloat(item.conversion_factor);
        let givenRate = parseFloat(item.custom_convert_rate);
        let givenUom = item.uom;

        let correctRate = givenRate;

        if (givenUom == "Kg") {
            correctRate = givenRate * cf;
        } else if (givenUom == "Gram") {
            correctRate = givenRate * cf / 1000;
        }
        
        console.log("cf", cf);
        console.log("givenRate", givenRate);
        console.log("correctRate", correctRate);

        frappe.model.set_value(cdt, cdn, 'rate', correctRate);
    }
});