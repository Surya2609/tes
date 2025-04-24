frappe.listview_settings['Lead'] = {
    refresh: function(me) {
        me.page.set_title(__("Lead List"));
    },

    get_indicator: function(doc) {
        let value = "Hot";
        if (doc.status === "Lead") {
            value = "Cold";
        } else if (doc.status === "Opportunity") {
            value = "Warm";
        } else if (doc.status === "Converted") {
            value = "Hot";
        }

        let color = "red"; // Default color
        if (value === "Cold") {
            color = "blue";
        } else if (value === "Warm") {
            color = "orange";
        } else if (value === "Hot") {
            color = "green";
        }

        return [__(value), color, "status,=," + value];
    },

    refresh: function(listview) {
        listview.refresh(); // Ensures list updates automatically when status changes
    }
};
