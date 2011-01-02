function EditDreamAssistant (dream) {
  this.dream = dream || new Dream();
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
    // TODO fix the model variables and database schema and add the tags!!!!!!
    // defaults
    this.dream.summary = this.dream.summary || "";
    this.dream.title = this.dream.title || "";
    this.dream.tags = this.dream.tags || []; // TODO
    this.dream.created_at = this.dream.created_at || Date.now();
    this.models.datePicker.date = new Date(this.dream.created_at);

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
/*
    this.controller.setupWidget("txtTags", {
      hintText: $L("Tags..."),
      multiline: false,
      enterSubmits: false,
      focus: false
    }, {
      value: this.dream.tags.join(" "),
      disabled: false
    });
*/

    // dream
    this.controller.setupWidget("richDream", { }, { });
    this.controller.get('richDream').innerHTML = this.dream.summary;

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

      this.dream.summary = this.controller.get('richDream').innerHTML;
      this.dream.title = this.controller.get('txtTitle').mojo.getValue();
      this.dream.created_at = this.models.datePicker.date.getTime();

      //tags: this.controller.get('txtTags').mojo.getValue().split(" ")

      // format the date
      var dateObj = new Date(dream.timestamp)
        , date_format
        , month = (dateObj.getMonth() + 1)
        , day = dateObj.getDate()
        , year = dateObj.getFullYear();

      // fix 9 into 09 for MM/DD/YYYY format
      month = (month > 9) ? month : "0" + month;
      day = (day > 9) ? day : "0" + day;
      date_format = month.toString() + day.toString() + year.toString();

      this.dream.dream_date = date_format;

      // add to the dreamcatcher
      var dream = new Dream();
      dream.hydrate(this.dream);
      dream.save();

      // update the index
      DreamsDB.updateSearchIndex(dream);

      // notify the awake
      Mojo.Controller.getAppController().showBanner("Dream saved", { 
        source: 'notification' 
      });
    }
  },

  deactivateWindow: function (event) {
    this.save();
  },

  cleanup: function (event) {
    this.save();
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "save":
        this.save();
        break;
      }
    }
  }

};
