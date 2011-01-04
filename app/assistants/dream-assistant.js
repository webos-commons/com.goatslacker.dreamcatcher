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
            { icon: "send", command: "send" }
          ]
        }
      ]
    }
  },

  setup: function () {
    // Menus
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, DreamsDB.appMenu);
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.models.cmdMenu);

    // default value
    this.dream.title = this.dream.title || "";

    // load into template
    var info = Mojo.View.render({ object: this.dream, template: 'dream/show' });
    this.controller.get('my-dream').update(info);

    // put the dream in the box
    this.controller.get('myDream').innerHTML = this.dream.summary;
  },

  handleCommand: function(event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "edit":
        Mojo.Controller.stageController.swapScene({ name: "edit-dream" }, this.dream);
        break;
      case "send": // TODO send as single JSON
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
          method: "open",
          parameters: { 
            id: "com.palm.app.email",
            params: {
              summary: "Dreamcatcher - " + this.dream.dream_date,
              text: this.dream.summary
            }
          }
        });
        break;
      }
    }
  }

};
