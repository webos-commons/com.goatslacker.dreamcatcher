/*global Mojo DreamsDB */
function PasswordAssistant() { }

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
      hintText: "Type Password",
      enterSubmits: true
    }, this.models.passwordField);

    this.controller.setupWidget("signIn", { }, this.models.signIn);

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
    // TODO FIX: password reset and password saving is kinda funky.
    // need to re-think of a way of auhenticating. people sometimes forget their passwords
    // and a password reset system is difficult to implement since you never know who you're giving the resetted password to
    var key = 'dr34m';
/*
    var i = 0
      , key = "";

    if (DreamsDB.prefs.email) {
      for (i = 0; i < 8; i = i + 1) {
        key = key + String.fromCharCode(Math.ceil((Math.random() * 74) + 48));
      }
    } else {
      key = "dr34m";
    }
*/
    DreamsDB.prefs.password = key;
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch (event.command) {
      case "support":
        this.resetPassword();

        var contact = { };
        //contact.value = DreamsDB.prefs.email || 'josh@goatslacker.com';
        contact.value = 'josh@goatslacker.com';
        contact.type = 'email';
        contact.role = 1;

        this.controller.serviceRequest("palm://com.palm.applicationManager", {
          method: "open",
          parameters: { 
            id: "com.palm.app.email",
            params: {
              recipients: [contact],
              summary: "Dreamcatcher: Help, I forgot my password"
            }
          }
        });

        break;
      }
    }
  }

};
