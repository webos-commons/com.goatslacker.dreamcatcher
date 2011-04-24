/*global Metrix AjaxRequestWrapper ServiceRequestWrapper DreamsDB Mojo */
function SplashAssistant() { }

SplashAssistant.prototype = {
  setup: function () {

    var self = this;

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
    DreamsDB.loadPrefs(function (prefs) {

      // Deprecate the dreamsdb database
      if (DreamsDB.prefs.noDepot === false) {
        DreamsDB.deprecate(self.controller, function () {
          self.controller.showAlertDialog({
            onChoose: function () {
              // apply the user preferences from ealier, unlock the app, and move on...
              self.updatePrefs(prefs);
            },
            title: "Success!",
            message: "Done merging data. Dreamcatcher is now up-to-date. Enjoy the new Search features ^_^",
            choices: [{
              label: "Ok",
              value: "cancel",
              type: 'affirmative'
            }]
          }); 
        }, function () {
          self.updatePrefs(prefs);
        });

      // the Depot is already deprecated, apply the user preferences.
      } else {
        self.updatePrefs(prefs);
      }

    }, this.unlock);
  },

  updatePrefs: function (prefs) {
    var self = this;

    // password
    if (DreamsDB.prefs.passwordProtect && DreamsDB.locked) {
      Mojo.Controller.stageController.swapScene({ name: "password" });
    } else {
  
      // theme
      this.controller.get('myBodyIsYourBody').className = "palm-" + DreamsDB.prefs.theme;

      // wallpaper
      if (DreamsDB.prefs.wallpaper) {
        this.controller.get('myBodyIsYourBody').style.backgroundImage = "url('" + DreamsDB.prefs.wallpaper + "')";

      // load system wallpaper
      } else {
        DreamsDB.ServiceRequest.request('palm://com.palm.systemservice', {
          method: "getPreferences",                                                          
          parameters: {
            keys: ["wallpaper"],
            subscribe: true
          },
          onSuccess: function (event) {
            var wallpaperImage = "file://" + event.wallpaper.wallpaperFile;
            DreamsDB.prefs.wallpaper = wallpaperImage;
            DreamsDB.savePrefs();
            self.controller.get('myBodyIsYourBody').style.backgroundImage = "url('" + wallpaperImage + "')";
          }
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
    }
  },

  unlock: function () {
    DreamsDB.locked = false;
    Mojo.Controller.stageController.swapScene({ name: "dreams" });
  }

};
