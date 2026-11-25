sap.ui.define([
    "sap/ui/core/UIComponent",
    "SprintBoardLite/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("SprintBoardLite.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

             // Tasks Model
            this.setModel(models.createTasksModel(), "tasks");

            // enable routing
            this.getRouter().initialize();
        }
    });
});