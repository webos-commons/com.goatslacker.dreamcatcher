/*global Dream Mojo */
function EditDreamAssistant(dream) {
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
        { 
          items: [
            { icon: "tag-icon", command: "tag" },
            { icon: "save", command: "save" }
          ]
        }
      ]
    }
  },

  handlers: { },

  setup: function () {
    // defaults
    this.dream.summary = this.dream.summary || "";
    this.dream.title = this.dream.title || "";
    this.dream.tags = this.dream.tags || [];
    this.dream.created_at = this.dream.created_at || Date.now();
    this.models.datePicker.date = new Date(this.dream.created_at);

    if (!this.models.datePicker.date.getTime()) {
      this.models.datePicker.date = new Date();
    }

    // Menus
    this.controller.setupWidget(Mojo.Menu.appMenu, { richTextEditMenu: true }, null);
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.models.cmdMenu);

    // date picker
    this.controller.setupWidget("dreamDate", { }, this.models.datePicker);

    // title (optional)
    this.controller.setupWidget("txtTitle", {
      hintText: "Title (optional)...",
      multiline: false,
      enterSubmits: false,
      focus: false
    }, {
      value: this.dream.title,
      disabled: false
    }); 
 
    this.controller.setupWidget("txtTags", {
      hintText: "Tags...",
      multiline: false,
      enterSubmits: false,
      focus: false
    }, {
      value: "",
      disabled: false
    });

    for (var i = 0; i < this.dream.tags.length; i = i + 1) {
      this.addCapsule(this.dream.tags[i]);
    }

    this.controller.get('txtTagsId').hide();

    // dream
    this.controller.setupWidget("richDream");
    this.controller.get('richDream').innerHTML = this.dream.summary;

    // handlers
    this.handlers.deactivate = this.deactivateWindow.bind(this);
    this.handlers.saveTag = this.saveTag.bind(this);
  },

  activate: function (event) {
    // listeners
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
    Mojo.Event.listen(this.controller.get("txtTags"), Mojo.Event.propertyChange, this.handlers.saveTag);
  },

  deactivate: function (event) {
    Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.handlers.deactivate);
  },

  save: function () {
    if (this.controller && this.controller.get('richDream').innerHTML !== "") {

      this.dream.summary = this.controller.get('richDream').innerHTML;
      this.dream.title = this.controller.get('txtTitle').mojo.getValue();
      this.dream.created_at = this.models.datePicker.date.getTime();

      // format the date
      var thisDream = this.dream,
          dateObj = new Date(this.dream.created_at),
          date_format,
          month = (dateObj.getMonth() + 1),
          day = dateObj.getDate(),
          year = dateObj.getFullYear();

      // fix 9 into 09 for MM/DD/YYYY format
      month = (month > 9) ? month : "0" + month;
      day = (day > 9) ? day : "0" + day;
      date_format = month.toString() + day.toString() + year.toString();

      this.dream.dream_date = date_format;

      // add to the dreamcatcher
      this.dream.save(function (dream) {
        // notify the awake
        Mojo.Controller.getAppController().showBanner("Dream saved", { 
          source: 'notification' 
        });
      });
    }
  },

  addTag: function () {
    this.controller.get('txtTagsId').show();
    this.controller.get('txtTags').mojo.setValue("");
    this.controller.get('txtTags').mojo.focus();
  },

  saveTag: function (event) {
    var tag = event.value,
        span = null;

    this.dream.tags.forEach(function (mytag) {
      if (tag === mytag) {
        tag = null;
        return false;
      }
    });

    // if there's a tag to enter
    if (tag) {
      // add it to the array
      this.dream.tags.push(tag);

      // create & add capsule
      this.addCapsule(tag);

      // reset the value of txtTags
      this.controller.get('txtTags').mojo.setValue("");

    // no tag, we hide the tag add field
    } else {
      this.controller.get('txtTagsId').hide();
    }
  },

  addCapsule: function (tag) {
    var span = null;

    // add it to capsule.
    span = document.createElement('span');
    span.innerHTML = tag;
    span.className = 'tag';

    // add capsule to box
    this.controller.get('tags').insert(span);
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
      case "tag":
        this.addTag();
        break;
      }
    }
  }

};
