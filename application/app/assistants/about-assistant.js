/*global Mojo DreamsDB */
function AboutAssistant() { }

AboutAssistant.prototype = {
  setup: function () {
    // force orientation
    this.controller.stageController.setWindowOrientation("up");

    // app version
    this.controller.get('appVersion').innerHTML = "Version " + Mojo.appInfo.version;
  },

  deactivate: function (event) {
    if (DreamsDB.prefs.allowRotate) {
      this.controller.stageController.setWindowOrientation("free");
    } else {
      this.controller.stageController.setWindowOrientation("up");
    }
  }
};
