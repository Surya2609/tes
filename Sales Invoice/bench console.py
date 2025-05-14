invoice_name = "RPL/25-26/00019" 
item_code = "MVPCTMSPC600752"           

# Fields to update
field_1 = "cgst_rate"
field_1 = "igst_rate"
field_1 = "sgst_rate"

field_2 = "sgst_amount"
value_1 = 855.00
value_2 = 855.00
value_2 = 855.00
value_2 = 855.00

# Get child table row name
item = frappe.get_all("Sales Invoice Item Unique", 
    filters={"parent": invoice_name, "item": item_code},
    fields=["name"]
)

# Update both fields
if item:
    frappe.db.set_value("Sales Invoice Item Unique", item[0].name, field_1, value_1)
    frappe.db.set_value("Sales Invoice Item Unique", item[0].name, field_2, value_2)
    frappe.db.commit()
    print("Fields updated successfully.")
else:
    print("Item not found.")