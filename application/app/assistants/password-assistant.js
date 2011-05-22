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
        { label: "Forgot Password", command: "forgot" }
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
    }
  },

  resetPassword: function () {
    Mojo.Controller.errorDialog("Password was reset");
    DreamsDB.prefs.password = "dream";
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      if (event.command === "forgot") {
        this.resetPassword();
      }
    }
  }

};
