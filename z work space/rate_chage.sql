#Rate Change
import frappe

# Inputs
purchase_order = "MV/PO/25-26-00856"
item_code = "MVPCSKM410SSHD8"
new_rate = 1.2

# Step 1: Update the rate in Purchase Order Item
frappe.db.sql("""
    UPDATE tabPurchase Order Item
    SET rate = %s,
        amount = qty * %s
    WHERE parent = %s
      AND item_code = %s
""", (new_rate, new_rate, purchase_order, item_code))

# Step 2: Reload the Purchase Order and recalculate totals
po = frappe.get_doc("Purchase Order", purchase_order)
po.calculate_taxes_and_totals()
po.save(ignore_permissions=True)

# Optional: Commit if running in console
frappe.db.commit()


# Total change
import frappe

# Inputs
po_name = "MV/PO/25-26-00856"
new_total = 6612.0  # Your new total value

# Step 1: Update total fields directly in the Purchase Order
frappe.db.sql("""
    UPDATE tabPurchase Order
    SET total = %s,
        base_total = %s,
        grand_total = %s,
        base_grand_total = %s,
        rounded_total = %s,
        base_rounded_total = %s
    WHERE name = %s
""", (new_total, new_total, new_total, new_total, new_total, new_total, po_name))

# Step 2: Optionally, log a comment for audit trail
frappe.get_doc({
    "doctype": "Comment",
    "comment_type": "Info",
    "reference_doctype": "Purchase Order",
    "reference_name": po_name,
    "content": f"⚠ Manually updated PO total to {new_total} via backend script on {frappe.utils.nowdate()}."
}).insert()

frappe.db.commit()

print(f"✅ Total value for PO {po_name} updated to {new_total}.")


#GST Rate Changing
import frappe

# Inputs
po_name = "MV/PO/25-26-00856"
tax_amount = 595.08
base_amount = tax_amount  # Assuming same for base currency
base_total = 6612.0
grand_total = base_total + (2 * tax_amount)

# Step 1: Update SGST
frappe.db.sql("""
    UPDATE tabPurchase Taxes and Charges
    SET tax_amount = %s,
        base_tax_amount = %s
    WHERE parent = %s AND account_head LIKE '%%SGST%%'
""", (tax_amount, base_amount, po_name))

# Step 2: Update CGST
frappe.db.sql("""
    UPDATE tabPurchase Taxes and Charges
    SET tax_amount = %s,
        base_tax_amount = %s
    WHERE parent = %s AND account_head LIKE '%%CGST%%'
""", (tax_amount, base_amount, po_name))

# Step 3: Update PO Total Fields
frappe.db.sql("""
    UPDATE tabPurchase Order
    SET taxes_and_charges_added = %s,
        base_taxes_and_charges_added = %s,
        grand_total = %s,
        base_grand_total = %s,
        rounded_total = %s,
        base_rounded_total = %s
    WHERE name = %s
""", (
    2 * tax_amount,
    2 * base_amount,
    grand_total,
    grand_total,
    grand_total,
    grand_total,
    po_name
))

# Step 4: Add comment
frappe.get_doc({
    "doctype": "Comment",
    "comment_type": "Info",
    "reference_doctype": "Purchase Order",
    "reference_name": po_name,
    "content": f"⚠ Manually updated SGST & CGST to {tax_amount} each. Grand total set to {grand_total}."
}).insert()

frappe.db.commit()

print("✅ Tax and total values updated successfully.")