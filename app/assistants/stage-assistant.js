function StageAssistant () {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the stage is first created */
  Mojo.Controller.stageController.pushScene({ name: "dreams" });

  // initialize the dreams database
  DreamsDB.initialize();

  DreamsDB.Metrix = new Metrix();
  DreamsDB.AjaxRequest = new AjaxRequestWrapper();
  DreamsDB.ServiceRequest = new ServiceRequestWrapper();
  DreamsDB.Metrix.postDeviceData();

  if (DreamsDB.Metrix) {
    DreamsDB.hasMetrix = true;
  }
};

StageAssistant.prototype.handleCommand = function (event) {
  if (event.type === Mojo.Event.command) {
    var scenes = Mojo.Controller.stageController.getScenes(), topScene = scenes[scenes.length - 1], swap = false;

    switch (event.command) {
    case 'help':
    case 'prefs':
      if (topScene.sceneName !== event.command) {
        Mojo.Controller.stageController.pushScene({ name: event.command });
      }
      break;
    }

  }
};
