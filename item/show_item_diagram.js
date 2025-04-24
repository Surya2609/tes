frappe.ui.form.on('Item', {
    refresh: function (frm) {
        fetch_diagram_files(frm);
    },
});
    
function fetch_diagram_files(frm) {
    frappe.call({
        method: "get_item_diagrams", // Backend method to fetch data
        args: {
            item_code: frm.doc.item_code, // Pass item_code to filter data
        },
        callback: function (response) {
            if (response.message) {
                const data = response.message;
                console.log(data);
                frm.clear_table("custom_files");
                if (data.length != 0) {
                    data.forEach((row) => {
                        let child = frm.add_child("custom_files");
                        child.diagram_name = row.diagram_name;
                        child.diagram_file = row.diagram;
                        child.notes = row.notes;
                    });
                    frm.refresh_field("custom_files");
                }
            }
        },
    });
}

// Handle the "View" button click in the child table
frappe.ui.form.on('Diagram File Viewer', {
    view: function (frm, cdt, cdn) {
        console.log(frm);
        const child = locals[cdt][cdn];
        if (child.diagram_file) {
            // Open the PDF in a new tab
            window.open(child.diagram_file, "_blank");
        } else {
            frappe.msgprint("No diagram file available to view.");
        }
    },
});