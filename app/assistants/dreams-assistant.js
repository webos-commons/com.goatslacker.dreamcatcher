function DreamsAssistant () { }

DreamsAssistant.prototype = {

  models: {
    cmdMenu: {
      items: [
        {},{}, {
          items: [
            { icon: "new", command: "dream" },
            { icon: "sync", command: "send" }
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
      DreamsDB.retrieveLatest(this.updateDreams.bind(this)); // TODO make this function

      // to add to DreamPeer
/*
      retrieveLatest: function (callback) {
        var c = new Snake.Criteria();
        c.addDescendingOrderByColumn(DreamPeer.ID);
        DreamPeer.doSelect(c, callback);
      }
*/
      
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
    var c = new Snake.Criteria();
    c.add(DreamPeer.ID, event.item.id);
    DreamPeer.doDelete(c);
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "dream":
        this.addDream();
        break;
      case "send":
        var text = [], i;

        for (i = 0; i < DreamsDB.dreams.length; i = i + 1) {
          text.push(DreamsDB.dreams[i].dream_date + "<br />----<br />" + DreamsDB.dreams[i].summary);
        }

        this.controller.serviceRequest("palm://com.palm.applicationManager", {
          method: "open",
          parameters: { 
            id: "com.palm.app.email",
            params: {
              summary: "Dreamcatcher Backup",
              text: text.join("<br /><br />") 
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
