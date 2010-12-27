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

      // TODO - deprecate the dreamsdb database
      if (DreamsDB.prefs.noDepot === false) {
        // prompt user that they are upgrading their data and should backup!
        // backup their data if yes, and then deprecate
        // else deprecate

        // if not loaded into new sql...
        // for loop and add into Snake
        //DreamsDB.get(this.updateDreams.bind(this));
        DreamsDB.deprecate();
  
        // TODO don't continue loading until dreamsDB has been deprecated, restart app!
      }

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

      this.unlock();

    }).bind(this), this.unlock.bind(this));
  },

  unlock: function () {
    DreamsDB.locked = false;
    Mojo.Controller.stageController.pushScene({ name: "dreams" });
  }
};
