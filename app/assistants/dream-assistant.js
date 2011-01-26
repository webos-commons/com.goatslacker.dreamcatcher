function DreamAssistant (dream) { 
  this.dream = dream;
}

DreamAssistant.prototype = {
  models: {
    cmdMenu: {
      items: [
        {},{}, {
          items: [
            { label: "Edit", command: "edit" },
            { icon: "sync", submenu: "submenu-sync" }
          ]
        }
      ]
    },
    syncMenu: {
      items: [ 
        { label: "Email as Text", command: "sendtxt" }, 
        { label: "Email as JSON", command: "sendjson" }
      ]
    }
  },

  setup: function () {
    // Menus
    this.controller.setupWidget("submenu-sync", {}, this.models.syncMenu);
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, DreamsDB.appMenu);
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.models.cmdMenu);

    // default value
    this.dream.title = this.dream.title || "";

    // load into template
    var info = Mojo.View.render({ object: this.dream, template: 'dream/show' });
    this.controller.get('my-dream').update(info);

    // put the dream in the box
    this.controller.get('myDream').innerHTML = this.dream.summary;

    // slap the tags
    // first we need to query for tags
    var c = new Snake.Criteria()
      , that = this;

    c.add(DreamTagPeer.DREAM_ID, this.dream.id);

    DreamTagPeer.doSelect(c, function (tags) {
      that.dream.tags = [];

      // loop through all tags and add to array
      for (var i = 0; i < tags.length; i = i + 1) {
        that.dream.tags.push(tags[i].tag);
      }

      // add to template
      that.controller.get('myTags').innerHTML = that.dream.tags.join(", ");
    });
  },

  backupData: function (json_format) {
    json_format = json_format || false;

    var dream_summary = "";

    if (json_format) {
      json_format = {};
      json_format.title = this.dream.title;
      json_format.summary = this.dream.summary;
      json_format.dream_date = this.dream.dream_date;
      json_format.created_at = this.dream.dream_date;

      dream_summary = Object.toJSON(json_format);
    } else {
      dream_summary = this.dream.summary;
    }

    this.controller.serviceRequest("palm://com.palm.applicationManager", {
      method: "open",
      parameters: { 
        id: "com.palm.app.email",
        params: {
          summary: "Dreamcatcher - " + this.dream.dream_date,
          text: dream_summary
        }
      }
    });
  },

  handleCommand: function(event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "edit":
        Mojo.Controller.stageController.swapScene({ name: "edit-dream" }, this.dream);
        break;
      case "sendtxt":
        this.backupData(false);
        break;
      case "sendjson":
        this.backupData(true);
        break;
      }
    }
  }

};
