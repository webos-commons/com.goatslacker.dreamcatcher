/*global Mojo DreamsDB Snake */
function DreamAssistant(dream, dreams) { 
  this.dream = dream;
  this.dreamsObj = dreams;
  this.prevDream = false;
  this.nextDream = false;

  for (var i = 0, max = dreams.length; i < max; i = i + 1) {
    if (dreams[i].id === dream.id) {
      if (dreams[i - 1]) {
        this.prevDream = dreams[i - 1];
      }

      if (dreams[i + 1]) {
        this.nextDream = dreams[i + 1];
      }
    }
  }
}

DreamAssistant.prototype = {
  models: {
    cmdMenu: {
      items: [
        {}, {}, {
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

    this.flickHandler = this.handleFlick.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.window, Mojo.Event.flick, this.flickHandler, false);

    // default value
    this.dream.title = this.dream.title || "";

    // load into template
    var info = Mojo.View.render({ object: this.dream, template: 'dream/show' }),
        that = this;
    this.controller.get('my-dream').update(info);

    // put the dream in the box
    this.controller.get('myDream').innerHTML = this.dream.summary;

    // slap the tags
    // first we need to query for tags
    Snake.venom.dreams_tags.find({ dream_id: this.dream.id }).doSelect(function (tags) {
      that.dream.tags = [];

      // loop through all tags and add to array
      for (var i = 0; i < tags.length; i = i + 1) {
        that.dream.tags.push(tags[i].tag);
      }

      // add to template
      that.controller.get('myTags').innerHTML = that.dream.tags.join(", ");
    });
  },

  cleanup: function (event) {
    Mojo.Event.stopListening(this.controller.window, Mojo.Event.flick, this.flickHandler, false);
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

  handleFlick: function (event) {
    Mojo.Log.error(JSON.stringify(event.velocity.x));
    if (event.velocity.x >= 500 && this.nextDream) {
      Mojo.Controller.stageController.swapScene({ name: "dream" }, this.prevDream, this.dreamsObj);
    } else if (event.velocity.x <= -500 && this.prevDream)   {
      Mojo.Controller.stageController.swapScene({ name: "dream" }, this.nextDream, this.dreamsObj);
    }
  },

  handleCommand: function (event) {
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
