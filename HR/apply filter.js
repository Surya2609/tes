frappe.listview_settings['Employee Checkin'] = {
    onload(listview) {
        listview.page.add_inner_button('AB/Half', () => {
            listview.filter_area.add([[ 
                'Employee Checkin', 
                'log_type', 
                'in', 
                ['-/-', 'IN/-'] 
            ]]);
        });
    }
};