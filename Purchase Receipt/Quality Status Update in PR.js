frappe.ui.form.on('Purchase Receipt', {
    before_save: function(frm) {
        if(frm.doc.name.startsWith('new-')){
            let qualityStatus = ""; 
            frm.doc.items.forEach((item) => {
                frappe.db.get_list('Item', {
                    filters: {
                        item_code: item.item_code 
                    },
                    fields: ['item_code', 'inspection_required_before_purchase'],
                    limit_page_length: 1 
                }).then((result) => {
                    if (result && result.length > 0) {
                        const itemInQualityInspection = result[0].inspection_required_before_purchase;
                        if (itemInQualityInspection === 1) {
                            qualityStatus = "Pending";  
                        }
                    }
                    frm.set_value('custom_quality_status', qualityStatus);
                    frm.refresh_field('custom_quality_status');
                });
            });
        }      
    }
});