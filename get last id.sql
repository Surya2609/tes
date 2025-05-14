SELECT 
    MAX(CAST(SUBSTRING(name, 5) AS UNSIGNED)) AS last_supplier_id_number
FROM 
    `tabSupplier`
WHERE 
    name REGEXP '^SUPP[0-9]+';