function PrefsAssistant () { }

PrefsAssistant.prototype = {
  models: { 
    importJSON: {
      label: "Import JSON",
      disabled: false
    },
    
    deleteAll: {
      label: "Delete All",
      buttonClass: "negative",
      disabled: false
    },

    themeSelector: {
      value: DreamsDB.prefs.theme,
      disabled: false,
      choices: [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" }
      ]
    },

    passwordProtect: {
      value: DreamsDB.prefs.passwordProtect,
      disabled: false
    },

    passwordEmail: {
      value: DreamsDB.prefs.email,
      autoFocus: false,
      disabled: !DreamsDB.prefs.passwordProtect 
    },

    passwordField: {
      value: DreamsDB.prefs.password, 
      autoFocus: false, 
      disabled: !DreamsDB.prefs.passwordProtect 
    },

    alwaysOn: {
      value: DreamsDB.prefs.alwaysOn,
      disabled: false
    },

    allowRotate: {
      value: DreamsDB.prefs.allowRotate,
      disabled: false
    },

    brightness: {
      value: DreamsDB.prefs.brightness,
      disabled: false
    },

    backgroundPicker: {
      label: "Change Background",
      disabled: false
    },

    dataPicker: {
      label: "Load Backup Data",
      disabled: false
    }
  },
  handlers: { },

  setup: function () {

    this.controller.get('scrim').hide();

    // ======================================  
    // Widgets
    // ======================================  

    // data management
    //this.controller.setupWidget('importJSON', { }, this.models.importJSON);
    this.controller.setupWidget('deleteAll', { }, this.models.deleteAll);

    // theme
    this.controller.setupWidget('themeSelector', {
      labelPlacement: Mojo.Widget.labelPlacementLeft,
      label: "Theme"
    }, this.models.themeSelector);

    // password
    this.controller.setupWidget('passwordProtect', {
      trueLabel: 'Yes',
      falseLabel: 'No'
    }, this.models.passwordProtect);
  
    // TODO need an info button thingy that displays why I need email address
    this.controller.setupWidget("passwordEmail", {
      hintText: "Email Address",
      textCase: Mojo.Widget.steModeLowerCase
    }, this.models.passwordEmail);

    this.controller.setupWidget("passwordLock", { 
      hintText: "Type Password" 
    }, this.models.passwordField);

    // always on
    this.controller.setupWidget('alwaysOn', {
      trueLabel: 'Yes',
      falseLabel: 'No'
    }, this.models.alwaysOn);

    // rotate
    this.controller.setupWidget('allowRotateToggle', {
      trueLabel: 'Yes',
      falseLabel: 'No'
    }, this.models.allowRotate);

    // brightness
    this.controller.setupWidget("brightnessSlider", {
      minValue: 0,
      maxValue: 100
    }, this.models.brightness);

    // background picker
    this.controller.setupWidget("backgroundPicker", {
    }, this.models.backgroundPicker);

    // data loader
    this.controller.setupWidget("dataPicker", {
    }, this.models.dataPicker);

    // handlers
    this.handlers = {
      deactivate: this.deactivateWindow.bind(this),
      showPasswordField: this.showPasswordField.bind(this),
      passwordLock: this.passwordLockUpdate.bind(this),
      allowRotate: this.allowRotateUpdate.bind(this),
      theme: this.themeUpdate.bind(this),
      alwaysOn: this.alwaysOnUpdate.bind(this),
      brightness: this.brightnessUpdate.bind(this),
      backgroundPicker: this.backgroundPickerHandler.bind(this),
      deleteAll: this.truncateDB.bind(this)
      dataPicker: this.dataPickerHandler.bind(this)
    }
  },

  activate: function (event) {
    // listeners
    Mojo.Event.listen(this.controller.get("passwordProtect"), Mojo.Event.propertyChange, this.handlers.showPasswordField);
    Mojo.Event.listen(this.controller.get("passwordLock"), Mojo.Event.propertyChange, this.handlers.passwordLock);
    Mojo.Event.listen(this.controller.get("allowRotateToggle"), Mojo.Event.propertyChange, this.handlers.allowRotate);
    Mojo.Event.listen(this.controller.get("themeSelector"), Mojo.Event.propertyChange, this.handlers.theme);
    Mojo.Event.listen(this.controller.get("alwaysOn"), Mojo.Event.propertyChange, this.handlers.alwaysOn);
    Mojo.Event.listen(this.controller.get("brightnessSlider"), Mojo.Event.propertyChange, this.handlers.brightness);
    Mojo.Event.listen(this.controller.get("backgroundPicker"), Mojo.Event.tap, this.handlers.backgroundPicker);
    Mojo.Event.listen(this.controller.get("dataPicker"), Mojo.Event.tap, this.handlers.dataPicker);
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
    Mojo.Event.listen(this.controller.get("deleteAll"), Mojo.Event.tap, this.handlers.deleteAll);
  },

  deactivate: function (event) {
    Mojo.Event.stopListening(this.controller.get("passwordProtect"), Mojo.Event.propertyChange, this.handlers.showPasswordField);
    Mojo.Event.stopListening(this.controller.get("passwordLock"), Mojo.Event.propertyChange, this.handlers.passwordLock);
    Mojo.Event.stopListening(this.controller.get("allowRotateToggle"), Mojo.Event.propertyChange, this.handlers.allowRotate);
    Mojo.Event.stopListening(this.controller.get("themeSelector"), Mojo.Event.propertyChange, this.handlers.theme);
    Mojo.Event.stopListening(this.controller.get("alwaysOn"), Mojo.Event.propertyChange, this.handlers.alwaysOn);
    Mojo.Event.stopListening(this.controller.get("brightnessSlider"), Mojo.Event.propertyChange, this.handlers.brightness);
    Mojo.Event.stopListening(this.controller.get("backgroundPicker"), Mojo.Event.tap, this.handlers.backgroundPicker);
    Mojo.Event.stopListening(this.controller.get("dataPicker"), Mojo.Event.tap, this.handlers.dataPicker);
    Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
    Mojo.Event.stopListening(this.controller.get("deleteAll"), Mojo.Event.tap, this.handlers.deleteAll);
  },

  deactivateWindow: function (event) {
    DreamsDB.savePrefs();
  },

  cleanup: function (event) {
    DreamsDB.savePrefs();
  },

  showPasswordField: function (event) {
    this.models.passwordField.value = "";
    this.models.passwordField.disabled = !event.value;
    this.controller.modelChanged(this.models.passwordField);
    DreamsDB.prefs.passwordProtect = event.value;
  },

  passwordLockUpdate: function (event) {
    DreamsDB.prefs.password = event.value;
  },

  themeUpdate: function (event) {
    var className = 'palm-' + event.value;
    this.controller.get('myBodyIsYourBody').className = className;
    DreamsDB.prefs.theme = event.value;
  },

  allowRotateUpdate: function (event) {
    DreamsDB.prefs.allowRotate = event.value;

    if (event.value) {
      this.controller.stageController.setWindowOrientation("free");
    } else {
      this.controller.stageController.setWindowOrientation("up");
    }
  },

  backgroundPickerHandler: function () {
    // background picker
    Mojo.FilePicker.pickFile({
      onSelect: (function (event) {
        var wallpaperImage = "file://" + event.fullPath;
        this.controller.get('myBodyIsYourBody').style.backgroundImage = "url('" + wallpaperImage + "')";
        DreamsDB.prefs.wallpaper = event.fullPath;
      }).bind(this),
      kind: "image",
      actionName: "Select Background",
      extensions: [ 'png', 'jpg', 'jpeg' ]
    }, this.controller.stageController);
  },

  brightnessUpdate: function (event) {
    this.controller.get('iWontTellAnybody').style.opacity = ((100 - event.value) / 100);
    DreamsDB.prefs.brightness = event.value;
  },

  alwaysOnUpdate: function (event) {
    this.controller.stageController.setWindowProperties({
      blockScreenTimeout: event.value
    });
    DreamsDB.prefs.alwaysOn = event.value;
  },

  truncateDB: function () {
    this.controller.showAlertDialog({
      onChoose: function (value) {
        if (value === true) {
          DreamPeer.doDelete(new Snake.Criteria(), function () {
            Mojo.Controller.errorDialog("Data has been deleted");
          });
        }
      },
      title: "Are you sure",
      message: "This will erase all the data stored on the device. Are you sure you wish to continue?",
      choices: [
        { label: "Yes, Continue", value: true, type: "negative" },
        { label: "Nevermind", value: "cancel", type: "dismiss" }
      ]
    });

  },

  dataPickerHandler: function () {
    Mojo.FilePicker.pickFile({
      onSelect: (function (event) {
        this.controller.get('scrim').show();
        var data = palmGetResource(event.fullPath),
            that = this;

        DreamsDB.loadBackupData(data, function () {
          that.controller.get('scrim').hide();
          Mojo.Controller.getAppController().showBanner("Data finished loading", { source : 'prefs' });
        });
      }).bind(this),
      actionName: "Select Dreamcatcher Backup",
      extensions: [ 'json', 'txt' ]
    }, this.controller.stageController);
  }

};
