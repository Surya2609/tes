frappe.listview_settings['Quality Inspection'] = {
    onload(listview) {
    },
    // add a custom button for each row
    button: {
        show(doc) {
            return doc.reference_name;  // Show button only if there's a reference_name
        },
        get_label() {
            return 'Report';  // Label for the button
        },
        get_description(doc) {
            return __('View {0}', [`${doc.reference_type} ${doc.reference_name}`]);
        },
        action(doc) {

            const print_format = 'MVD Quality Batch inspection Report'; // Your print format
            const doctype = 'Quality Inspection';
            const name = doc.name;
        
            frappe.call({
                method: 'frappe.utils.print_format.download_pdf',
                args: {
                    doctype,
                    name,
                    print_format,
                    no_letterhead: 0
                },
                callback(r) {
                    const file_url = r.message.file_url;
                    if (file_url) {
                        window.open(file_url, '_blank');
                    } else {
                        frappe.msgprint(__('Could not generate PDF'));
                    }
                }
            });

            // frappe.set_route('print', 'Quality Inspection', doc.name, {
            //     print_format: 'MVD Quality Batch inspection Report'  // Replace with your print format name
            // });
        }
    },
}
