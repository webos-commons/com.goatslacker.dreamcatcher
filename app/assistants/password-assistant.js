function PasswordAssistant () { }

PasswordAssistant.prototype = {
  models: {
    signIn: {
      buttonClass: "affirmative",
      label: "Secure Log In",
      disabled: false
    },

    passwordField: {
      value: "",
      autoFocus: true,
      disabled: false
    }
  },
  handlers: { },

  setup: function () {
    // Menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, {
      items: [
        { label: "Forgot Password", command: "support" }
      ]
    });

    // widgets
    this.controller.setupWidget("passwordField", { 
      hintText: "Type Password" 
    }, this.models.passwordField);

    this.controller.setupWidget("signIn", {
    }, this.models.signIn);

    // handlers
    this.handlers.login = this.logIn.bind(this);

    // hide error message
    this.controller.get('errorWrapper').hide();
  },

  activate: function () {
    Mojo.Event.listen(this.controller.get("signIn"), Mojo.Event.tap, this.handlers.login);
  },

  deactivate: function () {
    Mojo.Event.stopListening(this.controller.get("signIn"), Mojo.Event.tap, this.handlers.login);
  },

  logIn: function () {
    if (this.models.passwordField.value === DreamsDB.prefs.password) {
      DreamsDB.locked = false;
      Mojo.Controller.stageController.swapScene({ name: "dreams" });
    } else {
      this.controller.get('errorWrapper').show();
      this.controller.get('error_message').innerHTML = "Incorrect Password, Try Again";
      this.models.passwordField.value = "";
      this.controller.modelChanged(this.models.passwordField);
      // this.controller.get('passwordField').mojo.focus();
    }
  },

  resetPassword: function () {
    DreamsDB.prefs.password = "dr34m";
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "support":
        this.resetPassword();
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
          method: "open",
          parameters: { 
            id: "com.palm.app.email",
            params: {
              recipients: [{
                contactDisplay: 'Josh Perez',
                type: 'email',
                role: 1,
                value: 'josh@goatslacker.com'
              }],
              summary: "Dreamcatcher: Help, I forgot my password"
            }
          }
        });
        break;
      }
    }
  }

};
