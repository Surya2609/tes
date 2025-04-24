frappe.ui.form.on('Purchase Receipt', {
    refresh: function (frm) {
        frm.doc.items.forEach((item, index) => {
            console.log(item.serial_and_batch_bundle);
            if (item.serial_and_batch_bundle || item.rejected_serial_and_batch_bundle) {
                let batch_no = item.serial_and_batch_bundle;
                if(item.serial_and_batch_bundle){
                    batch_no = item.serial_and_batch_bundle;
                }else if(item.rejected_serial_and_batch_bundle){
                    batch_no = item.rejected_serial_and_batch_bundle;
                }                
                frappe.call({
                    method: "frappe.client.get",
                    args: {
                        doctype: "Serial and Batch Bundle",
                        name: batch_no, // Use the Serial and Batch Bundle ID
                    },
                    callback: function (response) {
                        console.log(response.message);
                        if (response.message) {
                             const batchEntries = response.message.entries; // Extract entries array
                            if (batchEntries && batchEntries.length > 0) {
                                const batchNo = batchEntries[0].batch_no; // Get the first batch_no
                                frm.doc.items[index].custom_item_batch_no = batchNo; // Populate the custom field
                                frm.refresh_field('items'); // Refresh the field to reflect changes
                            } else {
                                console.log("No batch entries found for Serial and Batch Bundle.");
                            }                            
                        }
                    }
                });
            }
        });
    }
});