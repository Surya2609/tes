frappe.listview_settings['Purchase Order'] = {
    refresh: function (listview) {
        document.querySelectorAll('.list-row-col').forEach(function (col) {
            col.style.minwidth = '160px';
            col.style.moxWidth = '160px';
        });

        document.querySelectorAll('.list-subject').forEach(function (col) {
            col.style.minwidth = '200px';
            col.style.moxWidth = '200px';
        });

    }
}



