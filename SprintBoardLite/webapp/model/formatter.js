sap.ui.define([], function () {

    "use strict";

    return {

        formatDueDate: function (sDate) {

            if (!sDate) {
                return "";
            }

            const oDate =
                new Date(sDate);

            return oDate.toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
        },

        priorityState: function (sPriority) {

            switch (sPriority) {

                case "High":
                    return "Error";

                case "Medium":
                    return "Warning";

                case "Low":
                    return "Information";

                default:
                    return "None";
            }
        },

        statusState: function (sStatus) {

            switch (sStatus) {

                case "Done":
                    return "Success";

                case "Open":
                    return "None";

                case "In Progress":
                    return "Information";

                default:
                    return "None";
            }
        }

    };

});