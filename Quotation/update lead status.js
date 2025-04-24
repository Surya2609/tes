frappe.ui.form.on("Quotation", {
    refresh: function(frm) {
        console.log("Refreshing Quotation form");
        setTimeout(() => {
            let createButton = $(frm.page.wrapper).find('button:contains("Create")');
            if (createButton.length > 0) {
                console.log("Create button found!");
                createButton.on("click", function() {
                    console.log("Create button clicked!");
                    setTimeout(() => {
                        let salesOrderOption = $(frm.page.wrapper).find('a:contains("Sales Order")');
                        if (salesOrderOption.length > 0) {
                            console.log("Sales Order option found!");
                            // Attach click listener to Sales Order option
                            salesOrderOption.on("click", function() {
                                console.log("Sales Order button clicked!");
                                update_status(frm);                                
                            });
                        } else {
                            console.log("Sales Order option not found!");
                        }
                    }, 300); // Delay for dropdown rendering
                });
            } else {
                console.log("Create button not found!");
            }
        }, 500); // Delay to ensure buttons are rendered
    }
});

function update_status(frm){
    if (frm.doc.party_name && frm.doc.party_name.startsWith("CRM-LEAD")) { // Assuming lead_name links to the Lead document
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: 'Lead',
                filters: { name: frm.doc.party_name },
                fieldname: 'status'
            },
            callback: function (response) {
                if (response.message) {
                    console.log(response.message);
                     current_status = response.message.status; // Get the current status from Lead
                    if (response.message.status != null) {
                        console.log(response.message.status);
                        if (response.message.status == "Opportunity") {
                            current_status = "Warm";
                        } else if (response.message.status == "Converted") {
                            current_status = "Hot";
                        } else {
                            current_status = "Cold";
                        }
                    }
                    
                    frappe.call({
                        method: 'frappe.client.set_value',
                        args: {
                            doctype: 'Lead',
                            name: frm.doc.party_name,
                            fieldname: 'custom_status_new',
                            value: current_status
                        },
                        callback: function (r) {}
                    });
                }
            }
        });
    }
}