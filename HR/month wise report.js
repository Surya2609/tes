async function fetchAttendance() {
    try {
        const name = document.getElementById("employeeName").value;
        if (name.length === 0) {
            document.getElementById("employeeSuggestions").innerHTML = "";
        }

        const company = document.getElementById("companySelect").value;  // Get selected company
        const month = parseInt(document.getElementById("monthSelect").value);
        const year = parseInt(document.getElementById("yearSelect").value);
        console.log("name", name);
        const response = await frappe.call({
            method: "get_employee_list",
            args: {
                employee_name: name,
                month: month,    // Pass the month as a number
                year: year,  // Pass the year as a number
                company: company  // Pass the selected company
            }
        });
        const employees = response.message;
        console.log("employees", employees);
        const tbody = document.getElementById("attendanceTable");
        tbody.innerHTML = "";  // Clear existing rows

        const groupedEmployees = employees.reduce((acc, emp) => {
            if (!acc[emp.employee_id]) {
                acc[emp.employee_id] = {
                    employee_name: emp.employee_name, // Store employee_name
                    records: [] // Store attendance records
                };
            }
            acc[emp.employee_id].records.push(emp);
            return acc;
        }, {});

        let index = 0; // Initialize the index counter

        for (const [employee_id, data] of Object.entries(groupedEmployees)) {
            const { employee_name, records: attendanceList } = data; // Extract employee_name and attendanceList
            index++; // Increment the index for each employee
            const row = document.createElement("tr");
            let dayColumns = "";
        
            for (let day = 1; day <= 31; day++) {
                // Find the attendance for the current day
                const attendance = attendanceList.find(e => e.day == day);
        
                const checkin = attendance ? formatTime(attendance.checkin_time) : "-";
                const checkout = attendance ? formatTime(attendance.checkout_time) : "-";
                const spent = attendance ? attendance.spent_time || "-" : "-";
                const empId = attendance ? attendance.name : "-";
                const fullDateTime = attendance ? attendance.checkin_time : "-";
        
                dayColumns += `
                    <td onclick="openEditDialog('${day}', '${employee_name}', '${checkin}', '${checkout}', '${empId}', '${fullDateTime}')">
                        <div class="attendance-cell" style="min-width: 150px; min-height: 50px; padding: 4px;">
                            <div style="font-size: 12px; display: flex; justify-content: space-between;">
                                <div style="flex: 1; text-align: right; padding-right: 5px;"><strong>IN:</strong></div>
                                <div style="flex: 1; text-align: left; white-space: nowrap;">${checkin}</div>
                            </div>
                            <div style="font-size: 12px; display: flex; justify-content: space-between;">
                                <div style="flex: 1; text-align: right; padding-right: 5px;"><strong>OUT:</strong></div>
                                <div style="flex: 1; text-align: left; white-space: nowrap;">${checkout}</div>
                            </div>
                            <div style="font-size: 12px; display: flex; justify-content: space-between;">
                                <div style="flex: 1; text-align: right; padding-right: 5px;"><strong>Spent:</strong></div>
                                <div style="flex: 1; text-align: left; white-space: nowrap;">${spent}</div>
                            </div>
                        </div>
                    </td>
                `;
            }
        
            row.innerHTML = `
                <td style="font-weight: bold; padding: 8px;">${index}</td> 
                <td style="font-weight: bold; padding: 8px;">
                    ${employee_name} (ID: ${employee_id}) <!-- Display Employee ID -->
                    <br>
                  <button onclick='calculateAttendance(${JSON.stringify(groupedEmployees[employee_id])}, "${month}", "${year}")'>Details</button>

                </td>
                ${dayColumns}
            `;
            tbody.appendChild(row);
        }
        

        console.log("Attendance data loaded successfully.");
    } catch (error) {
        console.error("Error fetching attendance data:", error);
    }
}

function calculateAttendance(employeeDetails, month, year) {
    console.log("emDet", employeeDetails);

    // Ensure employeeDetails has a 'records' array
    if (!employeeDetails || !Array.isArray(employeeDetails.records)) {
        console.error("Invalid data: employeeDetails.records should be an array.");
        return;
    }

    console.log("month", month);
    console.log("yr", year);

    const currentDate = new Date(); // Get today's date
    const inputMonth = parseInt(month); // Convert to number
    const inputYear = parseInt(year);

    let totalDays = new Date(year, month, 0).getDate(); // Get total days in the month

    // If the month and year match the current month and year, adjust totalDays to today's date
    if (inputYear === currentDate.getFullYear() && inputMonth === currentDate.getMonth() + 1) {
        totalDays = currentDate.getDate();
    }

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalSundays = 0;
const employeeName = employeeDetails.records[0].employee_name;
    const attendedDays = new Set(); // Track days with records
    const halfDayList = []; // Store half-day dates
    const absentDayList = []; // Store absent dates

    employeeDetails.records.forEach((attendance) => {
        console.log("att", attendance);
        const day = parseInt(attendance.day); // Convert day to number
        if (day > totalDays) return; // Ignore future dates

        attendedDays.add(day); // Store days with attendance

        const checkin = attendance.checkin_time;
        const checkout = attendance.checkout_time;
        const date = new Date(year, month - 1, day);
        const isSunday = date.getDay() === 0;

        // If it's a Sunday, mark as present
        if (isSunday) {
            presentDays++;
            totalSundays++;
            return; // Skip further checks
        }

        // If checkin_time is "00:00:00", still mark as present

        // if (checkin && checkin.endsWith("00:00:00")) {
        //     presentDays++;
        //     return; // Skip further checks
        // }

        if (checkin && checkin.includes("00:00:00")) {
            absentDays++;
            absentDayList.push(day);
            return; // Skip further checks
        }

        console.log("Checkin:", checkin);

        // Determine attendance status
        if (checkin && checkout) {
            presentDays++; // Full present
        } else if ((checkin && checkin.split(" ")[1] !== "00:00:00") || (checkout && checkout.split(" ")[1] !== "00:00:00")) {
            halfDays++; // Half day
            halfDayList.push(day);
        } else {
            absentDays++; // Otherwise, mark as absent
            absentDayList.push(day);
        }
    });

    // Count missing days as absent (excluding Sundays)
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month - 1, day);
        const isSunday = date.getDay() === 0;

        if (!attendedDays.has(day)) {
            if (isSunday) {
                presentDays++; // Mark Sunday as present
                totalSundays++;
            } else {
                absentDays++; // Mark as absent if not Sunday
                absentDayList.push(day);
            }
        }
    }

    openDetailsDialog(employeeName,totalDays, totalSundays,presentDays, halfDays, halfDayList, absentDays, absentDayList);
}

function openDetailsDialog(employeeName, totalDays, totalSundays, presentDays, halfDays, halfDayList, absentDays, absentDayList) {
    // Remove existing dialog if any
    let existingDialog = document.getElementById("attendanceDialog");
    if (existingDialog) {
        existingDialog.remove();
    }

    // Create dialog HTML structure
    const dialogHTML = `
        <div id="attendanceDialog" class="dialog-overlay">
            <div class="dialog-box">
                <h3>${employeeName}</h3>
                <div class="attendance-content">
                    <p><strong>Total Days:</strong> <span>${totalDays}</span></p>
                    <p><strong>Total Sundays:</strong> <span>${totalSundays}</span></p>
                    <p class="present"><strong>Present Days:</strong> <span>${presentDays}</span></p>
                    <p class="half-day"><strong>Half Days:</strong> <span>${halfDays}</span> (${halfDayList.length ? halfDayList.join(", ") : "None"})</p>
                    <p class="absent"><strong>Absent Days:</strong> <span>${absentDays}</span> (${absentDayList.length ? absentDayList.join(", ") : "None"})</p>
                </div>
                <button class="close-btn" onclick="closeAttendanceDialog()">Close</button>
            </div>
        </div>
    `;

    // Append dialog to body
    document.body.insertAdjacentHTML("beforeend", dialogHTML);

    // Apply CSS styles dynamically
    const styles = document.createElement("style");
    styles.innerHTML = `
        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .dialog-box {
            background: white;
            padding: 20px;
            width: 350px;
            border-radius: 10px;
            text-align: left;
            box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
        }
        h2 {
            margin-bottom: 10px;
            color: #333;
        }
        .attendance-content p {
            font-size: 16px;
            margin: 10px 0;
        }
        .present {
            color: green;
        }
        .half-day {
            color: orange;
        }
        .absent {
            color: red;
        }
        .close-btn {
            display: block;
            margin: 15px auto 0;
            padding: 8px 20px;
            background: red;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 5px;
        }
        .close-btn:hover {
            background: darkred;
        }
    `;
    document.head.appendChild(styles);
}

function closeAttendanceDialog() {
    const dialog = document.getElementById("attendanceDialog");
    if (dialog) {
        dialog.remove();
    }
}

// Function to close the details dialog
function closeDetailsDialog() {
    document.querySelector(".details-dialog")?.remove();
    document.querySelector(".dialog-overlay")?.remove();
}

function formatTime(datetime) {
    if (!datetime || datetime === "-") return "-";
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}


function populateYearDropdown() {
    const yearSelect = document.getElementById("yearSelect");
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
}

let employeeFetchTimeout;

function debouncedFetchEmployees() {
    clearTimeout(employeeFetchTimeout);
    employeeFetchTimeout = setTimeout(fetchAttendance, 400);
}

function openEditDialog(day, employee_name, checkinTime = "-", checkoutTime = "-", checkInId = "-", fullDateTime = "-") {
    // Check if a dialog already exists and return if open
    if (document.querySelector(".attendance-dialog")) {
        return;
    }

    // Create overlay (prevents interaction outside dialog)
    const overlay = document.createElement("div");
    overlay.classList.add("dialog-overlay");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(0, 0, 0, 0.5)"; // Semi-transparent background
    overlay.style.zIndex = "9998";

    // Create dialog
    const dialog = document.createElement("div");
    dialog.classList.add("attendance-dialog");
    dialog.style.position = "fixed";
    dialog.style.left = "50%";
    dialog.style.top = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "white";
    dialog.style.padding = "20px";
    dialog.style.borderRadius = "8px";
    dialog.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    dialog.style.zIndex = "9999";

    const inTimeOptions = generate12HourOptions(checkinTime);
    const outTimeOptions = generate12HourOptions(checkoutTime);

    dialog.innerHTML = `
        <h3>Edit Attendance</h3>
        <p><strong>Date:</strong> ${day}</p>
        <p><strong>Employee:</strong> ${employee_name}</p>
        <p><strong>ID:</strong> ${checkInId}</p>
        <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 10px;">
            <label>
                <strong>IN:</strong>
                <select id="inTime" style="width: 100%; font-size: 14px;">${inTimeOptions}</select>
            </label>
            <label>
                <strong>OUT:</strong>
                <select id="outTime" style="width: 100%; font-size: 14px;">${outTimeOptions}</select>
            </label>
        </div>
        <label>
            <strong>Reason:</strong>
            <textarea id="reason" rows="3" style="width: 100%; margin-top: 5px;"></textarea>
        </label>
        <br><br>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button onclick="saveAttendance('${day}', '${employee_name}', '${checkInId}', '${fullDateTime}')">Save</button>
            <button onclick="closeDialog()">Cancel</button>
        </div>
    `;

    // Append overlay and dialog to the body
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    // Set the selected values after appending to DOM
    const inTimeSelect = dialog.querySelector("#inTime");
    const outTimeSelect = dialog.querySelector("#outTime");

    if (checkinTime !== "-") {
        inTimeSelect.value = checkinTime;
    }

    if (checkoutTime !== "-") {
        outTimeSelect.value = checkoutTime;
    }

    document.body.style.overflow = "hidden";
}

function closeDialog() {
    document.querySelector(".attendance-dialog")?.remove();
    document.querySelector(".dialog-overlay")?.remove();

    // Re-enable scrolling after closing the dialog
    document.body.style.overflow = "auto";
   
}

function generate12HourOptions(selectedTime = "") {
    let options = "";
    const timeSet = new Set();

    for (let hour = 1; hour <= 12; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            const formattedMinute = minute < 10 ? `0${minute}` : minute;
            const amOption = `${hour}:${formattedMinute} AM`;
            const pmOption = `${hour}:${formattedMinute} PM`;

            // Check and add the AM option
            if (!timeSet.has(amOption)) {
                options += `<option value="${amOption}" ${selectedTime === amOption ? "selected" : ""}>${amOption}</option>`;
                timeSet.add(amOption);
            }

            // Check and add the PM option
            if (!timeSet.has(pmOption)) {
                options += `<option value="${pmOption}" ${selectedTime === pmOption ? "selected" : ""}>${pmOption}</option>`;
                timeSet.add(pmOption);
            }
        }
    }

    // If the selected time is not part of the options (like 5:59), add it
    if (selectedTime && !timeSet.has(selectedTime)) {
        options += `<option value="${selectedTime}" selected>${selectedTime}</option>`;
    }

    return options;
}

function formatOnlyDate(fullDateTime) {
    if (!fullDateTime) {
        console.error("fullDateTime is undefined or null.");
        return null;
    }

    // Extract date part as YYYY-MM-DD (no changes needed)
    const datePart = fullDateTime.split(" ")[0]; // YYYY-MM-DD

    return datePart; // ✅ CORRECT: Already in MySQL format
}


function formatDateTime(time, fullDateTime) {
    if (!fullDateTime) {
        console.error("fullDateTime is undefined or null.");
        return null;
    }

    // Extract the date part correctly as YYYY-MM-DD
    const datePart = fullDateTime.split(" ")[0]; // YYYY-MM-DD

    // Convert time to 24-hour format
    const formattedTime = convertTo24HourFormat(time);

    if (!formattedTime) {
        console.error("Invalid time format.");
        return null;
    }

    return `${datePart} ${formattedTime}`; // Correct MySQL format: YYYY-MM-DD HH:MM:SS
}

function convertTo24HourFormat(time) {
    // Convert time from 12-hour format (like '6:45 PM') to 24-hour format ('18:45')
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function saveAttendance(day, employee_name, checkinId, fullDateTime) {
    console.log("fullDateTime", fullDateTime);
    const inTime = document.getElementById("inTime").value;
    const outTime = document.getElementById("outTime").value;
    const reason = document.getElementById("reason").value;

    const onlyDateIn = inTime !== "-" ? formatOnlyDate(fullDateTime) : null;
    const onlyDateOut = outTime !== "-" ? formatOnlyDate(fullDateTime) : null;

    const timeIn = inTime !== "-" ? formatDateTime(inTime, fullDateTime) : null;
    const timeOut = outTime !== "-" ? formatDateTime(outTime, fullDateTime) : null;

    console.log(`inTime: ${timeIn}`);
    console.log(`outTime: ${timeOut}`);

    console.log(`dateIn: ${onlyDateIn}`);
    console.log(`dateOut: ${onlyDateOut}`);
    console.log(`checkinId: ${checkinId}`);
    console.log(`reason: ${reason}`);
    updateCheckin(timeIn, timeOut, onlyDateIn, onlyDateOut, checkinId, reason);
    fetchAttendance();
    closeDialog(document.querySelector("div[style*='position: fixed;']"));    
}

function updateCheckin(timeIn, timeOut, dateIn, dateOut, checkinId, description) {
    let log_type = "";
    let workHours = "00:00"; // Default

    if (timeIn && timeOut) {

        log_type = "IN/OUT";
        const start = new Date(timeIn);  // Example: 2025-03-19 09:00:00
        const end = new Date(timeOut);   // Example: 2025-03-19 17:30:00

        console.log("start", start);
        console.log("end", end);

        const diffInMs = end - start;  // Difference in milliseconds
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));  // Convert to minutes

        const hours = Math.floor(diffInMinutes / 60);  // Get hours
        const minutes = diffInMinutes % 60;  // Get remaining minutes

        console.log("both");
        workHours = `${hours} hrs ${minutes} min`;
        console.log(`Work Hours: ${hours} hrs ${minutes} min`);  // Display in desired format

    } else if (timeIn) {
        log_type = "IN/-";
    } else {
        log_type = "-/-";
    }

    let fieldname = {
        log_type: log_type,
        custom_time_out: timeOut,
        custom_date_out: dateOut,
        custom_work_hrs: workHours,
        custom_discription: description,
        custom_location: "Edited From HR",
    };

    if (dateIn) {
        fieldname.time = timeIn;
        fieldname.custom_date_in = dateIn;
    }

    console.log("fieldname", fieldname);

    if (fieldname.custom_date_in == "") {
        frappe.msgprint(__('Give Reason'));
    } else if (fieldname.time == null) {
        frappe.msgprint(__('Time IN is Must'));
    } else {
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: "Employee Checkin",
                name: checkinId,
                fieldname: fieldname
            },
            callback: function (response) {
                if (response.message) {
                    frappe.msgprint(__('Updated Successfully'));
                    console.log("Updated: ", response.message.name);
                }
            }
        });
    }
}


function makeAttendance() {


}


window.onload = () => {
    populateYearDropdown();
    fetchAttendance();
};
