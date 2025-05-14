frappe.ui.form.on('Sales Order Item', {
    custom_old_so_details: function (frm, cdt, cdn) {
        console.log("pressed");
        let item = locals[cdt][cdn]; 
        if (frm.doc.customer && item.item_code) {
            // Call the server method to get the last purchase rates when item is selected
            frappe.call({
                method: 'old_so_history',  // Replace with the correct path to your method
                args: {
                    item_code: item.item_code,
                    cusotmer: frm.doc.customer
                },
                callback: function (r) {
                    if (r.message) {
                        let data = r.message;  // Assign response to 'data'
                        console.log("--", data);  // Debugging output
                        dn_dialogue_fetch(item, data, frm);
                        // You can also update other fields or show messages
                        // dn_dialogue_fetch(item, data, frm);  // Show the rates in the dialog
                    }
                }
            });
        }
    }

});



// Function to display the rates in a dialog
function dn_dialogue_fetch(item, data, frm) {
    let fields = [
        {
            fieldname: 'rates',
            fieldtype: 'HTML', // Use HTML to inject the scrollable table
        }
    ];

    let dn_dialogue = new frappe.ui.Dialog({
        title: 'Last Delivery Note Summary',
        size: 'extra-large',
        fields: fields,
    });

    // Generate the scrollable table HTML
    const tableHTML = `
     <div class="scrollable-table-wrapper" style="overflow-x: auto; overflow-y: auto; max-height: 400px; border: 1px solid #ddd; padding: 10px;">
         <table class="scrollable-table" style="width: 1000px; border-collapse: collapse; text-align: left;">
             <thead>
                 <tr style="background-color: #f9f9f9;">
                     <th style="padding: 10px; width: 120px;">Delivery Id</th>
                       <th style="padding: 10px; width: 120px;">Customer</th>
                     <th style="padding: 10px; width: 80px;">Date</th>
                     <th style="padding: 10px; width: 80px;">Rate</th>
                     <th style="padding: 10px; width: 80px;">Quantity</th>
                 </tr>
             </thead>
             <tbody>
                 ${data.map((record, index) => `
                     <tr id="row-${index}" class="table-row" style="cursor: pointer;">
                         <td style="padding: 10px;">${record.name || ''}</td>
                          <td style="padding: 10px;">${record.customer || ''}</td>
                         <td style="padding: 10px;">${record.posting_date || ''}</td>
                          <td style="padding: 10px;" data-rate="${record.rate || ''}">${record.rate || ''}</td>
                         <td style="padding: 10px;">${record.qty || ''}</td>
                     </tr>`).join('')}
             </tbody>
         </table>
     </div>
 `;

    // Set the HTML content
    dn_dialogue.fields_dict.rates.$wrapper.html(tableHTML);


    // Add row selection functionality
    let selectedRow = null;
    dn_dialogue.$wrapper.find('.table-row').on('click', function () {
        // Remove highlight from the previously selected row
        if (selectedRow) {
            $(selectedRow).css('background-color', '');
        }

        // Highlight the clicked row
        selectedRow = this;
        $(selectedRow).css('background-color', '#d9f9d9'); // Light green background
    });

    // Add custom footer with buttons
    let customFooter = `
    <div class="custom-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <!-- Left Buttons -->
        <div class="left-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-secondary so-history-btn">SO History</button>
            <button class="btn btn-secondary product-details-btn">Product Details</button>
            <button class="btn btn-secondary more-details-btn">More Details</button>
        </div>
        <!-- Right Buttons -->
        <div class="right-buttons" style="display: flex; gap: 10px;">
            <button class="btn btn-success ok-btn">OK</button>
           
        </div>
    </div>
`;

    // Append the custom footer to the dialog
    // dn_dialogue.$wrapper.find('.frappe-control[data-fieldname="rates"]').append(customFooter);

    // Add event listeners for left buttons
    dn_dialogue.$wrapper.find('.so-history-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_so_history(dn_dialogue, item);
    });

    dn_dialogue.$wrapper.find('.product-details-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_product_details(dn_dialogue, item);
    });

    dn_dialogue.$wrapper.find('.more-details-btn').on('click', function () {
        dn_dialogue.hide();
        fetch_more_details(dn_dialogue, item, frm);
        ///////////////////////////////// fetch_product_details(dn_dialogue, item);
    });

    // Add event listeners for right buttons
    dn_dialogue.$wrapper.find('.ok-btn').on('click', function () {
        if (selectedRow) {
            // Get the rate from the selected row
            let selectedRate = $(selectedRow).find('td[data-rate]').data('rate');
            if (selectedRate) {
                frappe.model.set_value(item.doctype, item.name, 'rate', selectedRate);
                dn_dialogue.hide();
            } else {
                frappe.msgprint('Rate not available in the selected row.');
            }
        } else {
            frappe.msgprint('Please select a row first.');
        }
    });

    dn_dialogue.show();
}
