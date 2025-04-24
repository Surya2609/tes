WITH date_series AS (
    SELECT DATE_ADD(%(from_date)s, INTERVAL seq DAY) AS attendance_date
    FROM (
        SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
        SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL 
        SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL 
        SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL 
        SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL 
        SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL 
        SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL 
        SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL 
        SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL 
        SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL 
        SELECT 30
    ) AS seq_table
    WHERE DATE_ADD(%(from_date)s, INTERVAL seq DAY) <= %(to_date)s
)

SELECT 
    ds.attendance_date AS "attendance_date",
    emp.name AS "employee_id",
    emp.employee_name AS "employee_name",

    -- First check-in time for that day
    (SELECT MIN(ec_in.time) 
        FROM `tabEmployee Checkin` ec_in 
        WHERE ec_in.employee = emp.name 
        AND ec_in.log_type = 'IN' 
        AND DATE(ec_in.time) = ds.attendance_date
    ) AS "checkin_time",

    -- Last check-out time for that day
    (SELECT MAX(ec_out.time) 
        FROM `tabEmployee Checkin` ec_out 
        WHERE ec_out.employee = emp.name 
        AND ec_out.log_type = 'OUT' 
        AND DATE(ec_out.time) = ds.attendance_date
    ) AS "checkout_time"

FROM date_series ds
CROSS JOIN `tabEmployee` emp 

WHERE emp.name = %(employee)s 

-- Filter based on attendance_filter
HAVING (
    %(attendance_filter)s = 'All' OR
    (%(attendance_filter)s = 'Only Check-in' AND checkin_time IS NOT NULL AND checkout_time IS NULL) OR
    (%(attendance_filter)s = 'Only Check-out' AND checkin_time IS NULL AND checkout_time IS NOT NULL) OR
    (%(attendance_filter)s = 'No Check-in/Check-out' AND checkin_time IS NULL AND checkout_time IS NULL)
)

ORDER BY ds.attendance_date;
