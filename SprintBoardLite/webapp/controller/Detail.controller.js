sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    History
) {
    "use strict";

    return Controller.extend("SprintBoardLite.controller.Detail", {

        onInit: function () {

            this.getOwnerComponent()
                .getRouter()
                .getRoute("Detail")
                .attachPatternMatched(
                    this._onObjectMatched,
                    this
                );

        },

        _onObjectMatched: function (oEvent) {

            const sTaskId =
                oEvent.getParameter("arguments").taskId;

            const aTasks =
                this.getOwnerComponent()
                    .getModel("tasks")
                    .getProperty("/tasks");

            const oTask =
                aTasks.find(function (oItem) {
                    return oItem.id === sTaskId;
                });

            if (!oTask) {

                MessageBox.error("Task not found");

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("Overview");

                return;
            }

            const oDetailModel =
                new JSONModel(oTask);

            this.getView().setModel(
                oDetailModel,
                "detail"
            );
        },


        formatDate: function (sDate) {

            if (!sDate) {
                return "";
            }

            const aParts = sDate.split("-");

            if (aParts.length !== 3) {
                return sDate;
            }

            const oDate = new Date(
                Number(aParts[0]),
                Number(aParts[1]) - 1,
                Number(aParts[2])
            );

            return oDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        },


        onBack: function () {

            const oHistory =
                History.getInstance();

            const sPreviousHash =
                oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {

                window.history.go(-1);

            } else {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Overview",
                        {},
                        true
                    );
            }
        },

        onEdit: async function () {

            if (!this._oDialog) {

                this._oDialog = await sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "SprintBoardLite.fragment.TaskEditor",
                    controller: this
                });

                this.getView().addDependent(this._oDialog);
            }

            const oTask =
                this.getView()
                    .getModel("detail")
                    .getData();

            const iPriority =
                oTask.priority === "Low" ? 0 :
                    oTask.priority === "Medium" ? 1 : 2;

            const oEditModel =
                new sap.ui.model.json.JSONModel({

                    dialogTitle: "Edit Task",

                    id: oTask.id,

                    title: oTask.title,

                    category: oTask.category,

                    priorityIndex: iPriority,

                    dueDate: oTask.dueDate,

                    description: oTask.description,

                    favorite: oTask.favorite,

                    editMode: true
                });

            this._oDialog.setModel(
                oEditModel,
                "dialog"
            );

            this._oDialog.open();
        },

        onMarkComplete: function () {

            const sTaskId =
                this.getView()
                    .getModel("detail")
                    .getProperty("/id");

            const oTasksModel =
                this.getOwnerComponent()
                    .getModel("tasks");

            const aTasks =
                oTasksModel.getProperty("/tasks");

            const oTask =
                aTasks.find(
                    o => o.id === sTaskId
                );

            if (oTask) {

                oTask.status = "Done";

                oTasksModel.refresh(true);

                MessageToast.show(
                    "Task marked as completed"
                );

                this.getView()
                    .getModel("detail")
                    .setProperty(
                        "/status",
                        "Done"
                    );
            }
        },

        onDelete: function () {

            MessageBox.confirm(
                "Delete this task?",
                {
                    onClose: (sAction) => {

                        if (sAction !== "OK") {
                            return;
                        }

                        const sTaskId =
                            this.getView()
                                .getModel("detail")
                                .getProperty("/id");

                        const oTasksModel =
                            this.getOwnerComponent()
                                .getModel("tasks");

                        const aTasks =
                            oTasksModel.getProperty("/tasks");

                        const iIndex =
                            aTasks.findIndex(
                                o => o.id === sTaskId
                            );

                        if (iIndex > -1) {

                            aTasks.splice(
                                iIndex,
                                1
                            );

                            oTasksModel.refresh(true);

                            MessageToast.show(
                                "Task deleted"
                            );

                            this.onBack();
                        }
                    }
                }
            );
        },

        onSaveTask: function () {

            const oDialogModel =
                this._oDialog.getModel("dialog");

            const sTaskId =
                oDialogModel.getProperty("/id");

            const aTasks =
                this.getOwnerComponent()
                    .getModel("tasks")
                    .getProperty("/tasks");

            const oTask =
                aTasks.find(
                    o => o.id === sTaskId
                );

            if (oTask) {

                const iPriority =
                    oDialogModel.getProperty("/priorityIndex");

                oTask.title =
                    oDialogModel.getProperty("/title");

                oTask.category =
                    oDialogModel.getProperty("/category");

                oTask.dueDate =
                    oDialogModel.getProperty("/dueDate");

                oTask.description =
                    oDialogModel.getProperty("/description");

                oTask.favorite =
                    oDialogModel.getProperty("/favorite");

                oTask.priority =
                    iPriority === 0
                        ? "Low"
                        : iPriority === 1
                            ? "Medium"
                            : "High";

                this.getOwnerComponent()
                    .getModel("tasks")
                    .refresh(true);

                this.getView()
                    .getModel("detail")
                    .setData(oTask);

                MessageToast.show(
                    "Task updated successfully"
                );
            }

            this._oDialog.close();
        },

        onCancelDialog: function () {

            if (this._oDialog) {
                this._oDialog.close();
            }
        }

    });
});