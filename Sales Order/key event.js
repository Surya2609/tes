frappe.ui.form.on('Sales Order', {
    onload: function (frm) {
        let keyBuffer = '';
        let timeout;
        $(document).on('keydown', function (e) {
            if (
                $(e.target).is("input, textarea, select") ||
                e.target.isContentEditable
            ) {
                return;
            }

            if (/^[0-9]$/.test(e.key)) {
                keyBuffer += e.key;
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    let num = parseInt(keyBuffer);
                    if (!isNaN(num)) {
                        openOrAddRow(frm, num);
                        console.log("Requested row:", num);
                    }
                    keyBuffer = '';
                }, 600);
            }
        });
    }
});

function openOrAddRow(frm, num) {
    let grid = frm.fields_dict["items"].grid;
    let index = num === 0 ? 0 : num - 1;

    let existingRow = grid.grid_rows[index];

    if (existingRow) {
        existingRow.toggle_view(true);
    } else {
        // Check if previous row exists and has item_code
        let prevRow = grid.grid_rows[index - 1];
        if (prevRow && prevRow.doc.item_code) {
            // Add new row
            let newRow = frm.add_child("items");
            frm.refresh_field("items");

            // Wait a short time to ensure the UI updates, then open edit mode
            setTimeout(() => {
                let latestRow = grid.grid_rows[grid.grid_rows.length - 1];
                latestRow.toggle_view(true);
            }, 100);
        } else {
            frappe.msgprint(`Cannot open row ${num} — previous row is empty or doesn't exist.`);
        }
    }
}