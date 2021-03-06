/*global Mojo DreamsDB */
function HelpAssistant() { }

HelpAssistant.prototype = {
  setup: function () {
    // force orientation
    this.controller.stageController.setWindowOrientation("up");
  },

  deactivate: function (event) {
    if (DreamsDB.prefs.allowRotate) {
      this.controller.stageController.setWindowOrientation("free");
    } else {
      this.controller.stageController.setWindowOrientation("up");
    }
  }
};
