function DreamsAssistant () { }

DreamsAssistant.prototype = {

  models: {
    cmdMenu: {
      items: [
        { icon: "new", command: "dream" }
      ]
    },
    dreams: {
      items: []
    },
    spinner: {
      spinning: true
    },
    sort: {
      choices: [ 
        { label: "Date Asc", value: 1 }, 
        { label: "Date Desc", value: 2 }
      ], 
      value: 1
    }
  },
  handlers: { },

  setup: function () {

    // ======================================  
    // Preferences
    // ======================================

    // load prefs
    DreamsDB.loadPrefs((function (prefs) {

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

      this.load();

    }).bind(this), this.load.bind(this));

    // ======================================  
    // Menus
    // ======================================  

    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, DreamsDB.appMenu);
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.models.cmdMenu);

    // ======================================  
    // Widgets 
    // ======================================  

    // list
    this.controller.setupWidget("dreams", {
      itemTemplate: "dreams/list",
      addItemLabel: "New Dream ...",
      swipeToDelete: true,
      reorderable: true
    }, this.models.dreams);

/*
    // search
    this.controller.setupWidget("searchr", {
      enterSubmits: true,
      preventResize: true,
      requiresEnterKey: true
    }, { value: null });
    this.controller.get("search").hide();

    // sort
    this.controller.setupWidget("sort", false, this.models.sort);
*/

    // spinner
    this.controller.setupWidget('mojoSpinner', { spinnerSize: 'large' }, this.models.spinner);
    this.controller.get('spinnerScrim').show();

    // ======================================  
    // Handlers
    // ======================================  

    this.handlers = {
      viewDream: this.viewDream.bind(this),
      orderDreams: this.orderDreams.bind(this),
      deleteDream: this.deleteDream.bind(this)
    };

  },

  load: function () {
    // unlock the dreams
    DreamsDB.locked = false;

    // activate scene
    this.activate();
  },

  updateDreams: function (dreams) {
    if (this.controller) {
      this.controller.get('spinnerScrim').hide();
      this.models.spinner.spinning = false;
      this.controller.modelChanged(this.models.spinner);

      this.controller.get('dreams').mojo.noticeUpdatedItems(0, dreams);
    }
  },

  sortDreams: function (event) {
/*
    switch (event.value) {
    // sort by date ascending
    case '1':
      for (var i = 0; i < DreamsDB.dreams.length; i = i + 1) {
        Mojo.Log.error(DreamsDB.dreams[i].timestamp);
      }
      break;

    // sort by date descending
    case '2':
      for (var i = 0; i < DreamsDB.dreams.length; i = i + 1) {
        Mojo.Log.error(DreamsDB.dreams[i].timestamp);
      }
      break;
    }
*/
  },

  activate: function (event) {
    // load dreams into items model
    if (!DreamsDB.locked) {
      DreamsDB.get(this.updateDreams.bind(this));

      // ======================================  
      // Listeners
      // ======================================  

      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listAdd, this.addDream);
      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listTap, this.handlers.viewDream);
      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listReorder, this.handlers.orderDreams);
      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listDelete, this.handlers.deleteDream);
      //Mojo.Event.listen(this.controller.get('sort'), Mojo.Event.propertyChanged, this.sortDreams.bind(this));
    }
  },

  deactivate: function (event) {
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listAdd, this.addDream);
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listTap, this.handlers.viewDream);
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listReorder, this.handlers.orderDreams);
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listDelete, this.handlers.deleteDream);
    //Mojo.Event.stopListening(this.controller.get('sort'), Mojo.Event.propertyChanged, this.sortDreams.bind(this));
  },

  viewDream: function (event) {
    Mojo.Controller.stageController.pushScene({ name: "dream" }, event.item);
  },

  orderDreams: function (event) {
/*
    this.models.sort.value = 1;
    this.controller.modelChanged(this.models.sort);
*/

    DreamsDB.dreams.splice(event.fromIndex, 1);
    DreamsDB.dreams.splice(event.toIndex, 0, event.item);
    DreamsDB.save();
  },

  addDream: function () {
    Mojo.Controller.stageController.pushScene({ name: "edit-dream" });
  },

  deleteDream: function (event) {
    for (var i = 0; i < DreamsDB.dreams.length; i = i + 1) {
      if (event.item.id === DreamsDB.dreams[i].id) {
        DreamsDB.dreams.splice(i, 1);
        DreamsDB.save();
        break;
      }
    }
  },

  handleCommand: function(event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "dream":
        this.addDream();
        break;
      case "send":
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
          method: "open",
          parameters: { 
            id: "com.palm.app.email",
            params: {
              summary: "Dreamcatcher Backup",
              text: this.dreams 
            }
          }
        });
        break;
      case "refresh":
        DreamsDB.get(this.updateDreams.bind(this));
        break;
      }
    }
  }

};
