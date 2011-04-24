/*global DreamsDB Mojo */

// App Controller
function AppAssistant() {
}

// webOS 2.0
AppAssistant.prototype.handleLaunch = function (params) {
  if (typeof params.search === "string") {
    DreamsDB.curQuery = params.search;
  }
};

// Stage Controller
function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the stage is first created */
  Mojo.Controller.stageController.pushScene({ name: "splash" });
};

StageAssistant.prototype.handleCommand = function (event) {
  if (event.type === Mojo.Event.command) {
    var scenes = Mojo.Controller.stageController.getScenes(), topScene = scenes[scenes.length - 1];

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
