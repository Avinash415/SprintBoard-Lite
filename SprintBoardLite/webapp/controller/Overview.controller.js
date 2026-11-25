sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "SprintBoardLite/model/formatter"
], function (
    Controller,
    Fragment,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    MessageBox,
    MessageToast,
    formatter
) {
    "use strict";

    return Controller.extend("SprintBoardLite.controller.Overview", {

        formatter: formatter,

        onInit: function () {
            console.log("Overview Controller Loaded");

            this._updateStatistics();
        },

        _updateStatistics: function () {

            const aTasks =
                this.getOwnerComponent()
                    .getModel("tasks")
                    .getProperty("/tasks");

            const iOpen =
                aTasks.filter(
                    o => o.status === "Open"
                ).length;

            const iDone =
                aTasks.filter(
                    o => o.status === "Done"
                ).length;

            const oToday = new Date();

            const oWeekEnd = new Date();
            oWeekEnd.setDate(oToday.getDate() + 7);

            const iDueThisWeek =
                aTasks.filter(function (oTask) {

                    const oDue =
                        new Date(oTask.dueDate);

                    return (
                        oDue >= oToday &&
                        oDue <= oWeekEnd
                    );

                }).length;

            const oStatsModel =
                new JSONModel({
                    open: iOpen,
                    done: iDone,
                    dueThisWeek: iDueThisWeek
                });

            this.getView().setModel(
                oStatsModel,
                "stats"
            );
        },

        /* ==========================================================
           SEARCH & FILTERS
        ========================================================== */

        onSearch: function () {
            this._applyFilters();
        },

        onFilterChange: function () {
            this._applyFilters();
        },

        _applyFilters: function () {

            const oBinding = this.byId("taskTable")
                .getBinding("items");

            const sSearch =
                this.byId("searchField").getValue();

            const sStatus =
                this.byId("statusFilter").getSelectedKey();

            const sCategory =
                this.byId("categoryFilter").getSelectedKey();

            const aFilters = [];

            if (sSearch) {
                aFilters.push(
                    new Filter(
                        "title",
                        FilterOperator.Contains,
                        sSearch
                    )
                );
            }

            if (sStatus) {
                aFilters.push(
                    new Filter(
                        "status",
                        FilterOperator.EQ,
                        sStatus
                    )
                );
            }

            if (sCategory) {
                aFilters.push(
                    new Filter(
                        "category",
                        FilterOperator.EQ,
                        sCategory
                    )
                );
            }

            oBinding.filter(aFilters);
        },

        /* ==========================================================
           SORT
        ========================================================== */

        onSort: function () {

            const oBinding =
                this.byId("taskTable")
                    .getBinding("items");

            oBinding.sort(
                new Sorter("dueDate", false)
            );

            MessageToast.show("Sorted by Due Date");
        },

        /* ==========================================================
           GROUP
        ========================================================== */

        onGroup: function () {

            const oBinding =
                this.byId("taskTable")
                    .getBinding("items");

            oBinding.sort(
                new Sorter(
                    "category",
                    false,
                    true
                )
            );

            MessageToast.show("Grouped by Category");
        },

        /* ==========================================================
           RESET
        ========================================================== */

        onReset: function () {

            this.byId("searchField").setValue("");
            this.byId("statusFilter").setSelectedKey("");
            this.byId("categoryFilter").setSelectedKey("");

            const oBinding =
                this.byId("taskTable")
                    .getBinding("items");

            oBinding.filter([]);
            oBinding.sort(null);

            MessageToast.show("Filters Reset");
        },

        /* ==========================================================
           TABLE ROW CLICK
        ========================================================== */

        onTaskPress: function (oEvent) {

            const sTaskId =
                oEvent.getSource()
                    .getBindingContext("tasks")
                    .getProperty("id");

            this.getOwnerComponent()
                .getRouter()
                .navTo("Detail", {
                    taskId: sTaskId
                });
        },

        /* ==========================================================
           OPEN CREATE DIALOG
        ========================================================== */

        onNewTask: async function () {

            if (!this._oDialog) {

                this._oDialog = await Fragment.load({
                    name: "SprintBoardLite.fragment.TaskEditor",
                    controller: this
                });

                this.getView().addDependent(
                    this._oDialog
                );
            }

            const oDialogModel =
                new JSONModel({

                    dialogTitle: "Create Task",

                    title: "",
                    category: "",
                    priorityIndex: 1,
                    dueDate: "",
                    description: "",
                    favorite: false,

                    editMode: false
                });

            this._oDialog.setModel(
                oDialogModel,
                "dialog"
            );

            this._oDialog.open();
        },

        /* ==========================================================
           VALIDATION
        ========================================================== */

        _validateTask: function () {

            const sTitle =
                this._oDialog
                    .getModel("dialog")
                    .getProperty("/title");

            if (
                !sTitle ||
                sTitle.length < 4 ||
                sTitle.length > 70
            ) {

                MessageBox.error(
                    "Title must contain 4 to 70 characters."
                );

                return false;
            }

            const sCategory =
                this._oDialog
                    .getModel("dialog")
                    .getProperty("/category");

            if (!sCategory) {

                MessageBox.error(
                    "Category is required."
                );

                return false;
            }

            const sDueDate =
                this._oDialog
                    .getModel("dialog")
                    .getProperty("/dueDate");

            if (!sDueDate) {

                MessageBox.error(
                    "Due Date is required."
                );

                return false;
            }

            return true;
        },

        /* ==========================================================
           SAVE TASK
        ========================================================== */

        onSaveTask: function () {

            if (!this._validateTask()) {
                return;
            }

            const oDialogModel =
                this._oDialog.getModel("dialog");

            const oTaskModel =
                this.getOwnerComponent()
                    .getModel("tasks");

            const aTasks =
                oTaskModel.getProperty("/tasks");

            const bEditMode =
                oDialogModel.getProperty("/editMode");

            const iPriorityIndex =
                oDialogModel.getProperty("/priorityIndex");

            let sPriority = "Medium";

            if (iPriorityIndex === 0) {
                sPriority = "Low";
            } else if (iPriorityIndex === 2) {
                sPriority = "High";
            }

            if (bEditMode) {

                const sId =
                    oDialogModel.getProperty("/id");

                const oExistingTask =
                    aTasks.find(
                        o => o.id === sId
                    );

                if (oExistingTask) {

                    oExistingTask.title =
                        oDialogModel.getProperty("/title");

                    oExistingTask.category =
                        oDialogModel.getProperty("/category");

                    oExistingTask.dueDate =
                        oDialogModel.getProperty("/dueDate");

                    oExistingTask.description =
                        oDialogModel.getProperty("/description");

                    oExistingTask.favorite =
                        oDialogModel.getProperty("/favorite");

                    oExistingTask.priority =
                        iPriorityIndex === 0 ? "Low" :
                            iPriorityIndex === 1 ? "Medium" :
                                "High";
                }

                MessageToast.show(
                    "Task Updated"
                );

            } else {

                aTasks.push({

                    id: "T" + (aTasks.length + 101),

                    title:
                        oDialogModel.getProperty("/title"),

                    category:
                        oDialogModel.getProperty("/category"),

                    priority:
                        iPriorityIndex === 0 ? "Low" :
                            iPriorityIndex === 1 ? "Medium" :
                                "High",

                    status: "Open",

                    dueDate:
                        oDialogModel.getProperty("/dueDate"),

                    description:
                        oDialogModel.getProperty("/description"),

                    favorite:
                        oDialogModel.getProperty("/favorite")
                });

                MessageToast.show(
                    "Task Created"
                );
            }

            oTaskModel.refresh(true);

            this._updateStatistics();

            MessageToast.show(
                "Task created successfully"
            );

            this._oDialog.close();
        },

        /* ==========================================================
           CANCEL DIALOG
        ========================================================== */

        onCancelDialog: function () {

            if (this._oDialog) {
                this._oDialog.close();
            }
        }

    });

});