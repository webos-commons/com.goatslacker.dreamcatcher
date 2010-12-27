// holds all your dreams
var DreamsDB = {
  dreams: [],
  init: false,
  database: false,
  hasMetrix: false,
  locked: true,
  $lib: { },

/* Prefs */
  prefs: {
    wallpaper: false,
    brightness: 100,
    theme: 'light',
    allowRotate: false,
    passwordProtect: false,
    password: "",
    alwaysOn: true,
    noDepot: false
  },

/* App */

  appMenu: {
    visible: true,
    items: [
      Mojo.Menu.editItem,
      { label: "About", command: 'help' },
      { label: "Preferences", command: 'prefs' }
    ]
  },

  handleCommand: function (event) {
    if (event.type === Mojo.Event.command) {
      switch(event.command) {
      case "help":
        // push help scene
        break;
      }
    }
  },

/* Database */

  initialize: function () {
    // initialize
    if (!this.init) {

      // load the database
      if (!this.database) {
        this.database = new Mojo.Depot({
          name: "dreamsDb"
        });
      }
    }
  },

  deprecate: function () {
    // add
    if (this.prefs.noDepot === false) {

      if (this.dreams.length === 0) {
        this.database.get('dreams', (function (data) {
          if (data) {
            this.dreams = data;
          }
          this._deprecate(this.dreams);
        }).bind(this));
      } else {
        this._deprecate(this.dreams);
      }

    }
  },

  _deprecate: function (dreams) {
    var i = 0
      , dream;

    for (i = 0; i < dreams.length; i = i + 1) {
      dream = new Dream();
      dream.title = dreams[i].title;
      dream.summary = dreams[i].dream;
      dream.date_format = dreams[i].date_format;
      dream.created_at = dreams[i].timestamp;
      dream.save();
    }

    // make sure there are no errors and then dump the database
    this.database.add('dreams', {});

    // set in prefs that we're not using depot anymore
    this.prefs.noDepot = true;
  },

  loadPrefs: function (onSuccess, onFailure) {
    this.database.get('prefs', (function (data) {
      if (data) {
        this.prefs = data;
      }
      
      if (onSuccess) {
        onSuccess(this.prefs);
      }
    }).bind(this), onFailure);
  },

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  }
};
