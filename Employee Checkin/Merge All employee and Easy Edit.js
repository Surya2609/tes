frappe.listview_settings['Employee Checkin'] = {
    refresh: function (listview) {
        // Remove old buttons to prevent duplication
        $('.custom-merge-btn').remove();
        $('.custom-edit-btn').remove(); // Remove old Edit button

        // Add the Merge button
        let mergeButton = listview.page.add_button(__('Merge'), function () {
            let date_filter = null;
            let currentFilters = listview.filter_area.get();

            console.log("Current Filters:", currentFilters);

            currentFilters.forEach(filter => {
                if (filter[1] === "custom_date_in") {
                    date_filter = filter[3];
                }
            });

            if (!date_filter) {
                frappe.msgprint(__('Please set a date filter for this action.'));
                return;
            }

            frappe.call({
                method: "get_employees_without_checkin",
                args: { date_filter: date_filter },
                callback: function (response) {
                    console.log("res message",response.message);
                    if (response.message && Array.isArray(response.message)) {
                        console.log(response.message);
                        if (response.message.length > 0) {
                            insertEmployeeToCheckIn(response.message, date_filter);
                        } else {
                            frappe.msgprint(__('All Employees are already merged.'));
                        }
                    } else {
                        frappe.msgprint(__('Error fetching data. Please try again.'));
                    }
                }
            });

        }, 'Actions');

        mergeButton.addClass('custom-merge-btn');

        let editButton = listview.page.add_button(__('Edit'), function () {
            let selected_items = listview.get_checked_items();

            if (selected_items.length === 0) {
                frappe.msgprint(__('Please select at least one item to edit.'));
                return;
            }

            let filtered_date = null;
            let currentFilters = listview.filter_area.get();

            currentFilters.forEach(filter => {
                if (filter[1] === "custom_date_in") {
                    filtered_date = filter[3];
                }
            });

            open_edit_dialogue(selected_items, filtered_date);

        }, 'Actions');

        editButton.addClass('custom-edit-btn');
    }
};


function open_edit_dialogue(selected_items, filtered_date) {
    let item_names = selected_items.map(item => item.employee_name).join(', ');

    const dialog = new frappe.ui.Dialog({
        title: __('Edit Selected Items'),
        fields: [
            {
                label: 'Selected Items',
                fieldname: 'selected_items',
                fieldtype: 'Data',
                read_only: 1,
                default: item_names
            },
            {
                label: 'Log Type',
                fieldname: 'log_type',
                fieldtype: 'Select',
                options: 'IN/OUT\nIN/-\n-/-',
                reqd: 1,
                onchange: function () {
                    const logType = dialog.get_value('log_type');
                    if (logType === 'IN/OUT') {
                        dialog.get_field('time_in').df.hidden = 0;
                        dialog.get_field('time_out').df.hidden = 0;
                        dialog.get_field('time_in').set_value('09:00:00');
                        dialog.get_field('time_out').set_value('17:30:00');
                    } else if (logType === 'IN/-') {
                        dialog.get_field('time_in').df.hidden = 0;
                        dialog.get_field('time_out').df.hidden = 1;
                        dialog.get_field('time_in').set_value('09:00:00');
                        dialog.get_field('time_out').set_value('');
                    } else if (logType === '-/-') {
                        dialog.get_field('time_in').df.hidden = 1;
                        dialog.get_field('time_out').df.hidden = 1;
                        dialog.get_field('time_in').set_value('00:00:00');
                        dialog.get_field('time_out').set_value('');
                    }
                    dialog.refresh();
                }
            },
            {
                label: 'Time IN',
                fieldname: 'time_in',
                fieldtype: 'Time',
                default: '09:00:00'
            },
            {
                label: 'Time OUT',
                fieldname: 'time_out',
                fieldtype: 'Time',
                default: '17:30:00'
            },
            {
                label: 'Description',
                fieldname: 'description',
                fieldtype: 'Data',
                default: 'Late Entry'
            }
        ],
        primary_action_label: 'Submit',
        primary_action(values) {
            console.log("selected_items", selected_items);
            console.log("values", values);

            function formatDateTime(dateString, timeString) {
                const [year, month, day] = dateString.split('-');
                return `${year}-${month}-${day} ${timeString}`;  // Correct format: YYYY-MM-DD HH:mm:ss
            }

            let timeIn = formatDateTime(filtered_date, values.time_in);

            let timeOut = formatDateTime(filtered_date, values.time_out);
            console.log("timeIn", timeIn);
            console.log("timeOut", timeOut);


            let description = values.description;
            console.log("description", description);

            if (values.log_type == "IN/-") {
                update_employee_checkin(selected_items, timeIn, "", "IN/-", filtered_date, "", description);
            } else if (values.log_type == "IN/OUT") {
                update_employee_checkin(selected_items, timeIn, timeOut, "IN/OUT", filtered_date, filtered_date, description);
            } else if (values.log_type == "-/-") {
                let ab_time = formatDateTime(filtered_date, "00:00:00");
                update_employee_checkin(selected_items, ab_time, "", "-/-", filtered_date, "", description);
            }

            dialog.hide();
        }
    });

    // Initialize with "IN/OUT" settings by default
    dialog.get_field('time_out').df.hidden = 0;
    dialog.refresh();
    dialog.show();
}

function update_employee_checkin(selected_items, timeIn, timeOut, log_type, dateIn, dateOut, description) {
    console.log("tim", timeIn);
    console.log("timOut", timeOut);
    console.log("desc", description);
    let workHours = "";
    if (timeIn && timeOut) {
        const start = new Date(timeIn);  // Example: 2025-03-19 09:00:00
        const end = new Date(timeOut);   // Example: 2025-03-19 17:30:00

        const diffInMs = end - start;  // Difference in milliseconds
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));  // Convert to minutes

        const hours = Math.floor(diffInMinutes / 60);  // Get hours
        const minutes = diffInMinutes % 60;  // Get remaining minutes

        console.log("both");
        workHours = `${hours} hrs ${minutes} min`;
        console.log(`Work Hours: ${hours} hrs ${minutes} min`);  // Display in desired format
    } else {
        console.log("single");
    }

    selected_items.forEach(item => {
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: "Employee Checkin",
                name: item.name,
                fieldname: {
                    log_type: log_type,
                    time: timeIn,
                    custom_time_out: timeOut,
                    custom_date_in: dateIn,
                    custom_date_out: dateOut,
                    custom_work_hrs: workHours,
                    custom_discription: description,
                    custom_location: "Edited From HR",
                }
            },
            callback: function (response) {
                if (response.message) {
                    frappe.msgprint(__('Updated Successfully'));
                    console.log("Updated: ", response.message.name);
                }
            }
        });
    });
}

function insertEmployeeToCheckIn(employees, date_filter) {
    if (!employees || employees.length === 0) {
        frappe.msgprint(__('No missing employees to insert.'));
        return;
    }

    let insertedCount = 0; // Track successfully inserted employees
    let totalEmployees = employees.length;


    // Show loading indicator
    frappe.show_progress(__('Merge All Employees'), 0, totalEmployees, __('Processing...'));

    let promises = employees.map(employee => {
        return new Promise((resolve, reject) => {
            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Employee Checkin',
                        employee: employee.name,
                        custom_company: employee.company,
                        log_type: "-/-",
                        time: date_filter + " 00:00:00",
                        custom_date_in: date_filter,
                        location: "AB",
                        docstatus: 0,
                    },
                },
                callback: function (response) {
                    if (response.message) {
                        insertedCount++;
                    }
                    // Update progress bar
                    frappe.show_progress(__('Merge All Employees'), insertedCount, totalEmployees, __('Processing...'));

                    resolve();
                },
                error: function () {
                    resolve(); // Continue even if an error occurs for some employees
                }
            });
        });
    });

    // When all insert operations are done
    Promise.all(promises).then(() => {
        frappe.hide_progress(); // Hide loading indicator
        frappe.msgprint({
            title: __('Import Completed'),
            message: __('{0} employees imported successfully.', [insertedCount]),
            indicator: 'green',
        });
    });
}
