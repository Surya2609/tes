name_id = "MV/ODC/25-26-00131"  
item = "MV7991M512S"
field_name = "qty"  
new_value = 591

# Get 
item = frappe.get_all("Service DC OUT Items",
    filters={"parent": name_id, "item": item},
    fields=["name"]
)

# Update the field
if item:
    frappe.db.set_value("Service DC OUT Items", item[0].name, field_name, new_value)
      frappe.db.commit()
    print("Field updated successfully.")
else:
    print("Item not found.")