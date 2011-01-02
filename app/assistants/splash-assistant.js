function SplashAssistant () { }

SplashAssistant.prototype = {
  setup: function () {

    // initialize the dreams database
    DreamsDB.initialize();

    DreamsDB.Metrix = new Metrix();
    DreamsDB.AjaxRequest = new AjaxRequestWrapper();
    DreamsDB.ServiceRequest = new ServiceRequestWrapper();
    DreamsDB.Metrix.postDeviceData();

    if (DreamsDB.Metrix) {
      DreamsDB.hasMetrix = true;
    }

    // ======================================  
    // Preferences
    // ======================================

    // load prefs
    DreamsDB.loadPrefs((function (prefs) {

      // Deprecate the dreamsdb database
      if (DreamsDB.prefs.noDepot === false) {

        // prompt user that they are upgrading their data!
        this.controller.errorDialog("Dreamcatcher will be upgrading it's data to the latest version. This may take a minute or two. Do not close or restart the app until the data transfer has completed");

        // show scrim with spinner or status messages...???

        DreamsDB.deprecate((function () {
          this.controller.errorDialog("Done merging data. Dreamcatcher is now up-to-date. Enjoy the new Search features!");

          // apply the user preferences from ealier, unlock the app, and move on...
          this.updatePrefs(prefs);
        }).bind(this));

      // the Depot is already deprecated, apply the user preferences.
      } else {
        this.updatePrefs(prefs);
      }
    }).bind(this), this.unlock.bind(this));

  },

  updatePrefs: function (prefs) {
    // password
    if (DreamsDB.prefs.passwordProtect && DreamsDB.locked) {
      Mojo.Controller.stageController.swapScene({ name: "password" });
    }
  
    // theme
    this.controller.get('myBodyIsYourBody').className = "palm-" + DreamsDB.prefs.theme;

    // wallpaper
    if (DreamsDB.prefs.wallpaper) {
      this.controller.get('myBodyIsYourBody').style.backgroundImage = "url('" + DreamsDB.prefs.wallpaper + "')";

    // load system wallpaper
    } else {
      DreamsDB.ServiceRequest.request('palm://com.palm.systemservice', {
        method:"getPreferences",                                                          
        parameters: {
          keys: ["wallpaper"],
          subscribe: true
        },
        onSuccess: (function (event) {
          var wallpaperImage = "file://" + event.wallpaper.wallpaperFile;
          this.controller.get('myBodyIsYourBody').style.backgroundImage = "url('" + wallpaperImage + "')";
        }).bind(this)
      });
    }

    // screen brightness
    this.controller.get('iWontTellAnybody').style.opacity = ((100 - DreamsDB.prefs.brightness) / 100);

    // keep the app on
    if (DreamsDB.prefs.alwaysOn === true) {
      this.controller.stageController.setWindowProperties({
        blockScreenTimeout: true
      });
    }

    // rotate
    if (DreamsDB.prefs.allowRotate) {
      this.controller.stageController.setWindowOrientation("free");
    } else {
      this.controller.stageController.setWindowOrientation("up");
    }

    // unlock the app
    this.unlock();
  },

  unlock: function () {
    DreamsDB.locked = false;
    Mojo.Controller.stageController.pushScene({ name: "dreams" });
  }

};
