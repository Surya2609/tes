< ! DOCTYPE html > < html lang = "en" > < head > < meta charset = "UTF-8" > < meta name = "viewport" content = "width=device-width, initial-scale=1.0" > < link rel = "stylesheet" href = "styles.css" > < style > @media print {.page - break { page - break - before: always;

} } < / style > < / head > < body > { % for copy in ["Original", "Duplicate", "POD"] % } < div class = "copy-section" > < h2 style = "text-align: right ;" > { { copy } } Copy < / h2 > < ! -- Header Section -->
< div class = "header" > { %
set
    einvoice = frappe.db.get_value(
        "e-Invoice Log",
        { "reference_name": doc.name },
        ["acknowledgement_number", "acknowledged_on", "signed_qr_code"],
        as_dict = True
    ) % } < ! --           <div style="margin: 20px 5px 0 0; width: 100px; height: 100px;" class="right-img">-->
    < ! --    {{ web_block('E-Invoice QR Code', values={'qr_text': einvoice.signed_qr_code}) }}-->
    < ! --</div>-->
    < div style = "margin: 20px 5px 0 0;" class = "right-img" > { { web_block(
        'E-Invoice QR Code',
        values
            = { 'qr_text': einvoice.signed_qr_code }
    ) } } < / div > < img src = "/files/MVD Logo1 (1).jpg" alt = "Right Image" class = "right-img" > < ! --<img src="/files/MVD Logo.jpg" alt="Right Image" class="right-img">-->
    < div class = "company-details" > { % if doc.is_return == 1 % } < h4 > CREDIT NOTE < / h4 > { %
    else % } < h4 > TAX INVOICE < / h4 > { % endif % } < ! --<h4>{{ doc.qr_code }}</h4>-->
    < h5 > < strong > { { doc.company } } < / strong > < / h5 > { %
set
    company_details = frappe.db.get_value(
        "Company",
        { "company_name": doc.company },
        ["custom_address_1st_line", "custom_address_2nd_line", "gstin", "custom_state", "custom_state_code",
                "phone_no", "email"],
        as_dict = True
    ) % } < h6 class = "text-center " style = "padding: 0;" > Address: { { company_details.custom_address_1st_line } } < / h6 > < h6 > { { company_details.custom_address_2nd_line } } < / h6 > < h6 class = "text-center" style = "padding: 0;" > Mobile: { { company_details.phone_no } },
    Email: { { company_details.email } } < / h6 > < h6 style = "padding: 0;" > < strong > GST No: { { company_details.gstin } } < / strong > < / h6 > < h6 style = "padding: 3;" > < strong > State: { { company_details.custom_state } },
    State Code: { { company_details.custom_state_code } } < / strong > < / h6 > < / div > < / div > < ! -- Purchase Receipt Details -->
    < table class = "details-table" > < tr > < td style = "width: 30%;" > < h6 > < strong > Bill To,
    < / strong > < / h6 > < h6 > < strong > { { doc.customer_name } } < / strong > < / h6 > < p class = "text-justify" > < h6 > { { doc.address_display } } < / h6 > < / p > < / td > < td class = "text-justify" style = "width: 30%;" > < h6 > < strong > Place Of Supply: < / strong > < / h6 > < ! -- <h6>{{ doc.address_display }}</h6> -->
    { % if doc.shipping_address % } < h6 > { { doc.address_display } } < / h6 > { %
    else % } < h6 > { { doc.shipping_address } } < / h6 > { % endif % } < / td > < td class = "text-justify" style = "width: 30%;" > < h6 > < strong > Invoice NO: { { doc.name } } < / strong > < / h6 > < h6 > Invoice Date: { { doc.posting_date } } < / h6 > < h6 > SO NO: { %
set
    so_no = [] % } { % for item in doc.items % } { % if item.sales_order
    and item.sales_order not in so_no % } { %
set
    _ = so_no.append(item.sales_order) % } { % endif % } { % endfor % } { { so_no } } < ! -- {% for so in so_no %}
    { { so [-4:] if so | length >= 4
    else so } } { % if not loop.last % },
    { % endif % } { % endfor % } -->
    < / h6 > < h6 > Due Date: { { doc.due_date } } < / h6 > < h6 > PO Ref.No: { { doc.po_no } } < / h6 > < h6 > PO Ref.Date: { { doc.po_date } } < / h6 > < / td > < / tr > < ! -- Second Section -->
    < tr > < td colspan = "3" style = "padding: 0; border-top: 1px solid #ccc;" > < h6 style = "margin: 0; font-size: 12px;" > IRN NO { { doc.irn } } < / h6 > < / td > < / tr > < tr > < td colspan = "3" style = "padding: 0;" > { %
set
    einvoice = frappe.db.get_value(
        "e-Invoice Log",
        { "reference_name": doc.name },
        ["acknowledgement_number", "acknowledged_on"],
        as_dict = True
    ) % } { % if einvoice % } < h6 style = "margin: 0; font-size: 12px;" > Ack No: { { einvoice.acknowledgement_number
    or 'N/A' } } & nbsp;

& nbsp;

& nbsp;

& nbsp;

Ack Date: { { einvoice.acknowledged_on.strftime('%Y-%m-%d') if einvoice.acknowledged_on
else 'N/A' } } < / h6 > { %
else % } < h6 style = "margin: 0; font-size: 12px;" > Ack No: N / A & nbsp;

& nbsp;

& nbsp;

& nbsp;

Ack Date: N / A < / h6 > { % endif % } < / td > < / tr > < / table > { %
set
    myList = [
    {
        "item_code": "MV6923KM14SZK",
        "item_name": "FLANGE NUT WITH SERRATION STL ZNFLK M14",
        "description": "FLANGE NUT WITH SERRATION STL ZNFLK M14",
        "customer_part_code": "B190005043",
        "customer_discription": "Nut Hex Flanged M14 Zp Gr8/Gr10",
        "uom": "Nos",
        "qty": 28,
        "rate": 10.3,
        "unit_rate": 10.3,
        "amount": 288.4,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 25.956,
        "sgst_amount": 25.956,
        "batch_nos": "MV2025050200334",
        "warehouses": "86A4 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1030S8.8ZK",
        "item_name": "HEX BOLT STL 8.8 ZNFLK M10X30",
        "description": "HEX BOLT STL 8.8 ZNFLK M10X30",
        "customer_part_code": "B100000291",
        "customer_discription": "SCREW M10 x 30 8.8 ISO-4017",
        "uom": "Nos",
        "qty": 24,
        "rate": 4.15,
        "unit_rate": 4.15,
        "amount": 99.6,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 8.964,
        "sgst_amount": 8.964,
        "batch_nos": "MV2025052900245",
        "warehouses": "12A1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1035S8.8ZK",
        "item_name": "HEX BOLT STL 8.8 ZNFLK M10X35",
        "description": "HEX BOLT STL 8.8 ZNFLK M10X35",
        "customer_part_code": "B100000286",
        "customer_discription": "SCREW M10X35 -Gr8.8/10.9 - ISO 4017",
        "uom": "Nos",
        "qty": 8435,
        "rate": 4.6,
        "unit_rate": 4.6,
        "amount": 38801,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 3492.09,
        "sgst_amount": 3492.09,
        "batch_nos": "MV2025050206415",
        "warehouses": "54D1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1040S8.8ZK",
        "item_name": "HEX BOLT STL 8.8 ZNFLK M10X40",
        "description": "HEX BOLT STL 8.8 ZNFLK M10X40",
        "customer_part_code": "B100000285",
        "customer_discription": "SCREW M10X40 Gr8.8/10.9 INOX ISO 4017",
        "uom": "Nos",
        "qty": 40,
        "rate": 4.95,
        "unit_rate": 4.95,
        "amount": 198,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 17.82,
        "sgst_amount": 17.82,
        "batch_nos": "MV2025052900247",
        "warehouses": "12A1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1440S8.8ZK",
        "item_name": "HEX BOLT FULL THREAD 8.8 ZNFLK M14X40",
        "description": "HEX BOLT FULL THREAD 8.8 ZNFLK M14X40",
        "customer_part_code": "B100000525",
        "customer_discription": "HEX.HD.BOLT M14X40L Gr8.8/10.9",
        "uom": "Nos",
        "qty": 384,
        "rate": 16.43,
        "unit_rate": 16.43,
        "amount": 6309.12,
        "hsn_code": "73182990",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 567.8208,
        "sgst_amount": 567.8208,
        "batch_nos": "MV2025050201477",
        "warehouses": "64B4 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1450S8.8ZK",
        "item_name": "HEX BOLTS FULL THREAD 8.8G ZNFLK M14X50",
        "description": "HEX BOLTS FULL THREAD 8.8G ZNFLK M14X50",
        "customer_part_code": "B190100449",
        "customer_discription": "Bolt Hhcs M14X50 Zp Gr8.8/Gr10.9 W/W",
        "uom": "Nos",
        "qty": 192,
        "rate": 15.77,
        "unit_rate": 15.77,
        "amount": 3027.84,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 272.5056,
        "sgst_amount": 272.5056,
        "batch_nos": "MV2025050201483",
        "warehouses": "44E3 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1640S8.8ZK",
        "item_name": "HEX BOLT STL 8.8 ZNFLK M16X40",
        "description": "HEX BOLT STL 8.8 ZNFLK M16X40",
        "customer_part_code": "B100000524",
        "customer_discription": "HEX BOLT M16X40L",
        "uom": "Nos",
        "qty": 624,
        "rate": 19.84,
        "unit_rate": 19.84,
        "amount": 12380.16,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 1114.2144,
        "sgst_amount": 1114.2144,
        "batch_nos": "MV2025052900246",
        "warehouses": "12A1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1645S8.8ZK",
        "item_name": "HEX BOLT FULL THREAD 8.8G ZNFLK M16X45",
        "description": "HEX BOLT FULL THREAD 8.8G ZNFLK M16X45",
        "customer_part_code": "B100000289",
        "customer_discription": "SCREW M16X45 - Gr8.8/10.9 - ISO 4017",
        "uom": "Nos",
        "qty": 13195,
        "rate": 15.51,
        "unit_rate": 15.51,
        "amount": 204654.45,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 18418.9005,
        "sgst_amount": 18418.9005,
        "batch_nos": "MV2025050205543",
        "warehouses": "58D2 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1650S8.8ZK",
        "item_name": "HEX BOLT FULL THREAD 8.8 ZNFLK M16X50",
        "description": "HEX BOLT FULL THREAD 8.8 ZNFLK M16X50",
        "customer_part_code": "B100000526",
        "customer_discription": "HEX.HD.BOLT M16X50LGr8.8/10.9",
        "uom": "Nos",
        "qty": 56,
        "rate": 22.66,
        "unit_rate": 22.66,
        "amount": 1268.96,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 114.2064,
        "sgst_amount": 114.2064,
        "batch_nos": "MV2025052900243",
        "warehouses": "1B1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M1665S8.8ZK",
        "item_name": "HEX BOLT FULL THREAD 8.8 ZN FLAKE M16X65",
        "description": "HEX BOLT FULL THREAD 8.8 ZN FLAKE M16X65",
        "customer_part_code": "B100605987",
        "customer_discription": "Bolt Hhcs M16 X 65 Gr8.8/10.9 W/SW",
        "uom": "Nos",
        "qty": 68,
        "rate": 21,
        "unit_rate": 21,
        "amount": 1428,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 128.52,
        "sgst_amount": 128.52,
        "batch_nos": "MV2025050205546",
        "warehouses": "44C2 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV933M24100S8.8ZK",
        "item_name": "HEX BOLT FULL THREAD 8.8 ZNFLK M24X100",
        "description": "HEX BOLT FULL THREAD 8.8 ZNFLK M24X100",
        "customer_part_code": "B190000191",
        "customer_discription": "Bolt Hhcs M24 X 100 Zp Gr8.8/10.9",
        "uom": "Nos",
        "qty": 8,
        "rate": 97.22,
        "unit_rate": 97.22,
        "amount": 777.76,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 69.9984,
        "sgst_amount": 69.9984,
        "batch_nos": "MV2025050201600",
        "warehouses": "61A1 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV934M14SZK",
        "item_name": "HEX NUT STL ZNFLK M14",
        "description": "HEX NUT STL ZNFLK M14",
        "customer_part_code": "B100000167",
        "customer_discription": "HEX NUT M14 - 8 - ISO 4032 Gr8/10",
        "uom": "Nos",
        "qty": 608,
        "rate": 4.27,
        "unit_rate": 4.27,
        "amount": 2596.16,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 233.6544,
        "sgst_amount": 233.6544,
        "batch_nos": "MV2025050201868",
        "warehouses": "49D4 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MV934M16SZK",
        "item_name": "HEX NUT STL ZNFLK M16",
        "description": "HEX NUT STL ZNFLK M16",
        "customer_part_code": "B190005045",
        "customer_discription": "Nut Hex M16 Zp Gr8/Gr10",
        "uom": "Nos",
        "qty": 13940,
        "rate": 5.6,
        "unit_rate": 5.6,
        "amount": 78064,
        "hsn_code": "73181600",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 7025.76,
        "sgst_amount": 7025.76,
        "batch_nos": "MV2025050201873",
        "warehouses": "87A2 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MVA125M10SZK200HV",
        "item_name": "PLAIN WASHER STL ZN FLK 200HV M10",
        "description": "PLAIN WASHER STL ZN FLK 200HV M10",
        "customer_part_code": "B100007588",
        "customer_discription": "FLATWASHER M10-D.10,5X20X2-ISO7089 200HV",
        "uom": "Nos",
        "qty": 104000,
        "rate": 0.72,
        "unit_rate": 0.72,
        "amount": 74,880,
        "hsn_code": "73181600",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 6739.2,
        "sgst_amount": 6739.2,
        "batch_nos": "MV2025050206572",
        "warehouses": "61A1 - MVDF",
        "sales_order": "SO/24-25/16642-3, SO/24-25/16642-3"
    },
    {
        "item_code": "MVA125M10SZK200HV",
        "item_name": "PLAIN WASHER STL ZN FLK 200HV M10",
        "description": "PLAIN WASHER STL ZN FLK 200HV M10",
        "customer_part_code": "B100007588",
        "customer_discription": "FLATWASHER M10-D.10,5X20X2-ISO7089 200HV",
        "uom": "Nos",
        "qty": 24276,
        "rate": 0.72,
        "unit_rate": 0.72,
        "amount": 17478.72,
        "hsn_code": "73181600",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 1573.0848,
        "sgst_amount": 1573.0848,
        "batch_nos": "MV2025050206572",
        "warehouses": "61A1 - MVDF",
        "sales_order": "SO/24-25/16642-3, SO/24-25/16642-3"
    },
    {
        "item_code": "MVA125M14SZK200HV",
        "item_name": "PLAIN WASHER STL ZN FLK 200HV M14",
        "description": "PLAIN WASHER STL ZN FLK 200HV M14",
        "customer_part_code": "B100000166",
        "customer_discription": "WASHER ISO 7089-14-200 HV",
        "uom": "Nos",
        "qty": 208,
        "rate": 1.84,
        "unit_rate": 1.84,
        "amount": 382.72,
        "hsn_code": "73181110",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 34.4448,
        "sgst_amount": 34.4448,
        "batch_nos": "MV2025050202119",
        "warehouses": "64B3 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MVA125M16SZK200HV",
        "item_name": "PLAIN WASHER STL ZN FLK 200HV M16",
        "description": "PLAIN WASHER STL ZN FLK 200HV M16",
        "customer_part_code": "B100000290",
        "customer_discription": "WASHER ISO 7089-16-200 HV",
        "uom": "Nos",
        "qty": 21995,
        "rate": 1.99,
        "unit_rate": 1.99,
        "amount": 43770.05,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 3939.3045,
        "sgst_amount": 3939.3045,
        "batch_nos": "MV2025050202125",
        "warehouses": "64B2 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    },
    {
        "item_code": "MVA125M24SZK",
        "item_name": "PLAIN WASHER STL ZN FLAKE M24",
        "description": "PLAIN WASHER STL ZN FLAKE M24",
        "customer_part_code": "B190010056",
        "customer_discription": "Washer Flat M24 Zp",
        "uom": "Nos",
        "qty": 16,
        "rate": 5.52,
        "unit_rate": 5.52,
        "amount": 88.32,
        "hsn_code": "73181500",
        "igst_rate": 0,
        "cgst_rate": 9,
        "sgst_rate": 9,
        "igst_amount": 0,
        "cgst_amount": 7.9488,
        "sgst_amount": 7.9488,
        "batch_nos": "MV2025050204324",
        "warehouses": "57D3 - MVDF",
        "sales_order": "SO/24-25/16642-3"
    }
] % } < ! -- Items Table -->
    < table class = "table" > < thead > < tr > < th > Sl No.< / th > < th > Description of Product < / th > < th > HSN Code < / th > < th > Qty < / th > < th > UOM < / th > < th > Rate < / th > < th > Discount < / th > < th > Tax Rate < / th > < th > Tax Amt < / th > < th > Total Amount < / th > < / tr > < / thead > { %
set
    ns = namespace(shipping_total = 0, si_no = 1) % } { % for item in myList % } { % if "shipping" in item.item_code.lower() % } { %
set
    ns.shipping_total = ns.shipping_total + item.amount % } { %
set
    ns.shipping_tax_tl = item.igst_rate
    or 0 % } { %
    else % } < tr > < td > { { ns.si_no } } < / td > { # Use custom counter instead of loop.index #}
    < td > { % if item.customer_part_code % } < h6 > { { item.customer_part_code
    or "" } } < / h6 > { %
    else % } < h6 > { { item.item
    or "" } } < / h6 > { % endif % } { % if item.customer_part_description % } < h6 > { { item.customer_part_description
    or "" } } < / h6 > { %
    else % } < h6 > { { item.description
    or "" } } < / h6 > { % endif % } < h6 > Batch No: { { item.batch_nos } } < / h6 > < / td > < td > { { item.hsn_code } } < / td > < td > { { item.qty | abs } } < / td > < td > { { item.uom } } < / td > < td > { { item.rate } } < / td > < td > { { item.discount_percent
    or 0 } } < / td > < td > { % if item.cgst_rate
    and item.sgst_rate % } { { item.cgst_rate + item.sgst_rate } } % { % elif item.igst_rate % } { { item.igst_rate } } % { %
    else % } 0 % { % endif % } < / td > < td > { %
set
    cgst = item.cgst_amount | float(default = 0) % } { %
set
    sgst = item.sgst_amount | float(default = 0) % } { %
set
    igst = item.igst_amount | float(default = 0) % } { % if cgst > 0
    or sgst > 0 % } { { (cgst + sgst) | round(2) | abs } } { % elif igst > 0 % } { { igst | round(2) | abs } } { %
    else % } 0.00 { % endif % } < / td > < ! -- <td>
    { % if item.cgst_amount
    and item.sgst_amount % } { { (
        item.cgst_amount | float + item.sgst_amount | float
    ) | round(2) } } { % elif item.igst_amount % } { { item.igst_amount | float | round(2) } } { %
    else % } 0.00 { % endif % } < / td > -->
    < ! --<td>-->
    < ! --    {% if item.igst_amount %}-->
    < ! --        {{ item.igst_amount }}-->
    < ! --    {% else %}-->
    < ! --        {{ item.cgst_amount or 0 + item.sgst_amount or 0 }}-->
    < ! --    {% endif %}-->
    < ! --</td>-->
    < td > { { item.amount | abs } } < / td > < / tr > { %
set
    ns.si_no = ns.si_no + 1 % } { % endif % } { % endfor % } < / tbody > < / table > < div style = "display: flex; width: 100%; align-items: flex-start;" > < ! -- Left Side: Table -->
    < div style = "flex: 1; margin-right: 20px;" > < table class = "table" style = "width: 100%; border-collapse: collapse; border: 1px solid #ddd;" > < thead > < tr > < th style = "text-align: center;" colspan = "2" > CGST < / th > < th style = "text-align: center;" colspan = "2" > SGST < / th > < th style = "text-align: center;" colspan = "2" > IGST < / th > < th style = "text-align: center;" colspan = "2" > UGST < / th > < / tr > < / thead > < tbody > < tr > < td style = "text-align: center;" > Rate % < / td > < td style = "text-align: center;" > AMT < / td > < td style = "text-align: center;" > Rate % < / td > < td style = "text-align: center;" > AMT < / td > < td style = "text-align: center;" > Rate % < / td > < td style = "text-align: center;" > AMT < / td > < td style = "text-align: center;" > Rate % < / td > < td style = "text-align: center;" > AMT < / td > < / tr > { % if not doc.taxes % } < ! -- If there are no taxes, show a row with zeros -->
    < tr > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < td style = "text-align: center;" > 0 < / td > < / tr > { %
    else % } < ! -- Loop through taxes if the list is not empty -->
    { % for tax in doc.taxes % } < tr > { % if tax.gst_tax_type == "cgst" % } < td style = "text-align: center;" > { { tax.rate } } < / td > < td style = "text-align: center;" > { { tax.tax_amount | abs } } < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > { % elif tax.gst_tax_type == "sgst" % } < td > < / td > < td > < / td > < td style = "text-align: center;" > { { tax.rate } } < / td > < td style = "text-align: center;" > { { tax.tax_amount | abs } } < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > { % elif tax.gst_tax_type == "igst" % } < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td style = "text-align: center;" > { { tax.rate } } < / td > < td style = "text-align: center;" > { { tax.tax_amount | abs } } < / td > < td > < / td > < td > < / td > { % elif tax.gst_tax_type == "ugst" % } < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td > < / td > < td style = "text-align: center;" > { { tax.rate } } < / td > < td style = "text-align: center;" > { { tax.tax_amount | abs } } < / td > { % endif % } < / tr > { % endfor % } { % endif % } < / tbody > < / table > < / div > < ! -- Right Side: Summary -->
    < div style = "flex: 1; padding: 10px;" > < div style = "display: flex; justify-content: space-between;" > < strong > Shipping Charges < / strong > < span style = "text-align: center;" > < / span > < ! -- <span>{{3800}}</span> -->
    < span > { { ns.shipping_total
    or 0 | abs } } < / span > < / div > < ! -- <div style="display: flex; justify-content: space-between;">
    < strong > Shipping Tax < / strong > < span style = "text-align: center;" > < / span > < span > { { ns.shipping_tax_tl
    or 0 } } % < / span > < / div > -->
    < div style = "display: flex; justify-content: space-between;" > < strong > Sub Total < / strong > < span > { { doc.total | abs } } < / span > < / div > < div style = "display: flex; justify-content: space-between;" > < strong > Cash Discount: < / strong > < span style = "text-align: center;" > { { doc.additional_discount_percentage } } % < / span > < span > { { doc.discount_amount } } < / span > < / div > < div style = "display: flex; justify-content: space-between;" > < strong > Total Tax < / strong > { %
set
    total_tax = doc.taxes | selectattr("charge_type", "equalto", "On Net Total") | map(attribute = "tax_amount") | sum % } { %
set
    shipping_total = doc.taxes | selectattr("charge_type", "equalto", "Actual") | map(attribute = "tax_amount") | sum % } < div style = "display: flex; justify-content: space-between;" > < span > { { total_tax | abs } } < / span > < / div > < / div > { # All Actual charge rows #}
    < ! -- After the items loop, display Shipping Charges -->
    < div style = "display: flex; justify-content: space-between; margin-bottom: 5px;" > < strong > Round off < / strong > < span > { { doc.rounding_adjustment } } < / span > < / div > < hr style = "margin: 5px 0;" > < div style = "display: flex; justify-content: space-between; margin-bottom: 5px;" > < strong > Grand Total < / strong > < span > { { doc.rounded_total | abs } } < / span > < / div > < hr style = "margin: 5px 0;" > < / div > < / div > < div class = "footer" > { %
set
    company_details = frappe.db.get_value(
        "Company",
        { "company_name": doc.company },
        ["custom_bank_name",
            "custom_branch", "custom_ifsc", "custom_ac_no"],
        as_dict = True
    ) % } < p > Total Amount (In Words): < strong > { { doc.in_words } } < / strong > < / p > < hr > < div style = "display: flex; justify-content: space-between; margin-bottom: 10px;" > < div style = "text-align: left;" > < span > Bank Name: { { company_details.custom_bank_name } } < / span > < / div > < div style = "text-align: right;" > < span > A / C Number: { { company_details.custom_ac_no } } < / span > < / div > < / div > < div style = "display: flex; justify-content: space-between; margin-bottom: 10px;" > < div style = "text-align: left;" > < span > IFSC: { { company_details.custom_ifsc } } < / span > < / div > < div style = "text-align: right;" > < span > Branch: { { company_details.custom_branch } } < / span > < / div > < / div > < hr > < ! -- Terms & Conditions and Signatory (Avoid breaking across pages) -->
    < div style = "break-inside: avoid; page-break-inside: avoid; margin-top: 20px; display: flex; border: 1px solid #000;" > < ! -- Left Side: Terms & Conditions -->
    < div style = "flex: 1; padding: 15px; border-right: 1px solid #000;" > < strong > Terms & Conditions: < / strong > < ol style = "margin-top: 5px; padding-left: 20px;" > < li > We declare that this invoice shows the actual price of the goods described
    and that all particulars are true
    and correct.< / li > < li > Subject to Bangalore Jurisdiction < / li > < li > This is a Computer Generated Invoice < / li > < li > < strong > WE ARE A SMALL ENTERPRISE UNIT REGISTERED UNDER MSME Act vide Registration Number UDYAM - KR -03 -0017581 < / strong > < / li > < / ol > < / div > < ! -- Right Side: Authorized Signatory -->
    < div style = "flex: 0 0 300px; padding: 15px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;" > < span > For,
    < strong > { { doc.company } } < / strong > < / span > < br > < span > Authorised Signatory < / span > < / div > < / div > < ! -- Force Page Break After T&C for duplicate copy -->
    < div style = "page-break-after: always;" > < / div > { % endfor % } s < ! -- Force Page Break Before Terms & Conditions -->
    < ! --<div style="page-break-before: always;"></div>-->
    < ! --<div style="display: flex; border: 1px solid #000; margin-top: 20px;">-->
    < ! -- Left Side: Terms & Conditions -->
    < ! --    <div style="flex: 1; padding: 15px; border-right: 1px solid #000;">-->
    < ! --        <strong>Terms & Conditions:</strong>-->
    < ! --        <ol style="margin-top: 5px; padding-left: 20px;">-->
    < ! --            <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>-->
    < ! --            <li>Subject to Bangalore Jurisdiction</li>-->
    < ! --            <li>This is a Computer Generated Invoice</li>-->
    < ! --            <li><strong>WE ARE A SMALL ENTERPRISE UNIT REGISTERED UNDER MSME Act vide Registration Number UDYAM-KR-03-0017581</strong></li>-->
    < ! --        </ol>-->
    < ! --    </div>-->
    < ! -- Right Side: Authorized Signatory -->
    < ! --    <div style="flex: 0 0 300px; padding: 15px; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">-->
    < ! --        <span>For, <strong>{{ doc.company }}</strong></span>-->
    < ! --        <br>-->
    < ! --        <span>Authorised Signatory</span>-->
    < ! --    </div>-->
    < ! --</div>-->
    < / body > < / html >