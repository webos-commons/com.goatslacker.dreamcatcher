function EditDreamAssistant (dream) {
  this.dream = dream || {};
}

EditDreamAssistant.prototype = {
  models: {
    datePicker: {
      date: null
    },
    cmdMenu: {
      items: [
        {},
        {},
        { icon: "save", command: "save" }
      ]
    }
  },

  handlers: { },

  setup: function () {
    // defaults
    this.dream.dream = this.dream.dream || "";
    this.dream.title = this.dream.title || "";
    this.dream.tags = this.dream.tags || [];
    this.dream.timestamp = this.dream.timestamp || Date.now();
    this.models.datePicker.date = new Date(this.dream.timestamp);

    // Menus
    this.controller.setupWidget(Mojo.Menu.appMenu, { richTextEditMenu: true }, null);
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.models.cmdMenu);

    // date picker
    this.controller.setupWidget("dreamDate", {
      label: ' '
    }, this.models.datePicker);

    // title (optional)
    this.controller.setupWidget("txtTitle", {
      hintText: $L("Title (optional)"),
      multiline: false,
      enterSubmits: false,
      focus: false
    }, {
      value: this.dream.title,
      disabled: false
    }); 
 
    // tags
    this.controller.setupWidget("txtTags", {
      hintText: $L("Tags..."),
      multiline: false,
      enterSubmits: false,
      focus: false
    }, {
      value: this.dream.tags.join(" "),
      disabled: false
    });

    // dream
    this.controller.setupWidget("richDream", { }, { });
    this.controller.get('richDream').innerHTML = this.dream.dream;

    // handlers
    this.handlers.deactivate = this.deactivateWindow.bind(this);
  },

  activate: function (event) {
    // listeners
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
  },

  deactivate: function (event) {
    Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
  },

  save: function () {
    if (this.controller && this.controller.get('richDream').innerHTML != "") {

      // store the dream in an object
      var dreamObj = {
        id: this.dream.id,
        dream: this.controller.get('richDream').innerHTML, 
        timestamp: this.models.datePicker.date.getTime(), 
        title: this.controller.get('txtTitle').mojo.getValue(), 
        tags: this.controller.get('txtTags').mojo.getValue().split(" ")
      };

      // compare if the dream has changed since last save
      if (dreamObj.dream !== this.dream.dream ||
        dreamObj.timestamp !== this.dream.timestamp ||
        dreamObj.title !== this.dream.title ||
        dreamObj.tags.join(" ") !== this.dream.tags.join(" ")
      ) {

        // post the dream to the dreamcatcher
        this.dream = DreamsDB.post(dreamObj);
    
        // notify the awake
        Mojo.Controller.getAppController().showBanner("Dream saved", { 
          source: 'notification' 
        });
      }
    }
  },

  deactivateWindow: function (event) {
    this.save();
  },

  cleanup: function (event) {
    this.save();
  },

  handleCommand: function(event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "save":
        this.save();
        break;
      }
    }
  }

};
