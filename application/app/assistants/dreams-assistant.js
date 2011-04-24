/*global Mojo Snake DreamsDB */
function DreamsAssistant() {
  this.dreams = [];
}

DreamsAssistant.prototype = {

  models: {
    cmdMenu: {
      items: [
        {
          items: [
            { icon: "sort-icon", submenu: "submenu-sort" }
          ]
        }, {}, {
          items: [
            { icon: "new", command: "dream" },
            { icon: "sync", submenu: "submenu-sync" }
          ]
        }
      ]
    },
    dreams: {
      items: []
    },
    spinner: {
      spinning: true
    },
    syncMenu: {
      items: [ 
        { label: "Email as Text", command: "sendtxt" }, 
        { label: "Email as JSON", command: "sendjson" }
      ]
    },
    sortMenu: {
      items: [ 
        { label: "Date Asc", command: "sortasc" }, 
        { label: "Date Desc", command: "sortdesc" }
      ]
    },
    search: {
      value: DreamsDB.curQuery
    }
  },
  handlers: { },

  setup: function () {

    // ======================================  
    // Menus
    // ======================================  

    this.controller.setupWidget("submenu-sort", {}, this.models.sortMenu);
    this.controller.setupWidget("submenu-sync", {}, this.models.syncMenu);
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, DreamsDB.appMenu);
    this.controller.setupWidget("submenu-sync", {}, this.models.syncMenu);
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

    // search
    this.controller.setupWidget("searchr", {
      enterSubmits: true,
      preventResize: true,
      requiresEnterKey: true,
      hintText: "Search your dreams"
    }, this.models.search);

/*
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
      deleteDream: this.deleteDream.bind(this),
      doSearch: this.doSearch.bind(this)
    };
  },

  updateDreams: function (dreams) {
    if (this.dreams.length > 0) {
      this.controller.get('dreams').mojo.noticeRemovedItems(0, this.dreams.length);
    }

    this.dreams = dreams;

    if (this.controller) {
      this.controller.get('spinnerScrim').hide();
      this.models.spinner.spinning = false;
      this.controller.modelChanged(this.models.spinner);

      this.controller.get('dreams').mojo.noticeUpdatedItems(0, dreams);
    }
  },

  activate: function (event) {
    // load dreams into items model
    if (!DreamsDB.locked) {

      if (DreamsDB.curQuery) {
        this.doSearch({ value: DreamsDB.curQuery });   
      } else {
        DreamsDB.retrieveLatest(this.updateDreams.bind(this));
      }

      // ======================================  
      // Listeners
      // ======================================  

      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listAdd, this.addDream);
      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listTap, this.handlers.viewDream);
      Mojo.Event.listen(this.controller.get('dreams'), Mojo.Event.listDelete, this.handlers.deleteDream);
      Mojo.Event.listen(this.controller.get('searchr'), Mojo.Event.propertyChange, this.handlers.doSearch);

      //Mojo.Event.listen(this.controller.get('sort'), Mojo.Event.propertyChanged, this.sortDreams.bind(this));
    }
  },

  deactivate: function (event) {
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listAdd, this.addDream);
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listTap, this.handlers.viewDream);
    Mojo.Event.stopListening(this.controller.get('dreams'), Mojo.Event.listDelete, this.handlers.deleteDream);
    Mojo.Event.stopListening(this.controller.get('searchr'), Mojo.Event.propertyChange, this.handlers.doSearch);
    //Mojo.Event.stopListening(this.controller.get('sort'), Mojo.Event.propertyChanged, this.sortDreams.bind(this));
  },

  viewDream: function (event) {
    Mojo.Controller.stageController.pushScene({ name: "dream" }, event.item, this.dreams);
  },

  addDream: function () {
    Mojo.Controller.stageController.pushScene({ name: "edit-dream" });
  },

  deleteDream: function (event) {
    var id = event.item.id;

    // TODO cascade on delete automatically
    Snake.venom.dreams_search.find({ dream_id: id }).doDelete();
    Snake.venom.dreams_tags.find({ dream_id: id }).doDelete();
    Snake.venom.dreams.find(id).doDelete();
  },

  doSearch: function (event) {
    event.value = event.value || null;

    if (event.value) {
      DreamsDB.doSearch(event.value, this.updateDreams.bind(this));
    } else {
      DreamsDB.retrieveLatest(this.updateDreams.bind(this));
    }

    DreamsDB.curQuery = event.value;
  },

  backupData: function (json_format) {
    json_format = json_format || false;

    var tmp = []
      , i = 0
      , dreams = "";

    if (json_format) {
      for (i = 0; i < DreamsDB.dreams.length; i = i + 1) {
        json_format = {};

        json_format.title = DreamsDB.dreams[i].title;
        json_format.summary = DreamsDB.dreams[i].dream.replace(/<br>/gi, "");
        json_format.dream_date = DreamsDB.dreams[i].date_format;
        json_format.created_at = DreamsDB.dreams[i].timestamp;

        tmp.push(json_format);
      }

      dreams = JSON.stringify({ "dreams": tmp });
    } else {

      for (i = 0; i < DreamsDB.dreams.length; i = i + 1) {
        tmp.push(DreamsDB.dreams[i].dream_date + "<br />----<br />" + DreamsDB.dreams[i].summary);
      }

      dreams = tmp.join("<br /><br />");
    }

    this.controller.serviceRequest("palm://com.palm.applicationManager", {
      method: "open",
      parameters: { 
        id: "com.palm.app.email",
        params: {
          summary: "Dreamcatcher Backup",
          text: dreams
        }
      }
    });
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "dream":
        this.addDream();
        break;
      case "sortasc":
        DreamsDB.retrieveLatest(this.updateDreams.bind(this), true);
        DreamsDB.prefs.sort = true;
        DreamsDB.savePrefs();
        break;
      case "sortdesc":
        DreamsDB.retrieveLatest(this.updateDreams.bind(this), false);
        DreamsDB.prefs.sort = false;
        DreamsDB.savePrefs();
        break;
      case "sendtxt":
        this.backupData(false);
        break;
      case "sendjson":
        this.backupData(true);
        break;
      case "refresh":
        DreamsDB.retrieveLatest(this.updateDreams.bind(this));
        break;
      }
    } else if (event.type === Mojo.Event.back) {
      if (DreamsDB.curQuery) {
        DreamsDB.curQuery = null;
        this.controller.get('searchr').mojo.setValue("");
        this.doSearch({ value: DreamsDB.curQuery });
        event.stop();
        event.stopPropagation();
      }
    }
  }

};
