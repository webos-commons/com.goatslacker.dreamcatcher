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
    alwaysOn: true
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

  get: function (callback) {
    if (this.dreams.length === 0) {
      this.database.get('dreams', (function (data) {
        if (data) {
          this.dreams = data;
        }
        callback(this.dreams);
      }).bind(this));
    } else {
      callback(this.dreams);
    }
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

  post: function (dream) {
    if (!this.init) {
      this.initialize();
    }

    // defaults
    dream.title = dream.title || "";
    dream.timestamp = dream.timestamp || Date.now();
    dream.tags = dream.tags || [];

    // vars
    var dateObj = new Date(dream.timestamp),
      date_format,
      month = (dateObj.getMonth() + 1),
      day = dateObj.getDate(),
      year = dateObj.getFullYear(),
      i = 0;

    // fix 9 into 09 for MM/DD/YYYY format
    month = (month > 9) ? month : "0" + month;
    day = (day > 9) ? day : "0" + day;
    date_format = month.toString() + day.toString() + year.toString();

    // edit
    if (dream.id) {

      // loop through all the dreams
      for (i = 0; i < this.dreams.length; i = i + 1) {

        // if we found the right dream
        if (this.dreams[i].id === dream.id) {
          
          // correct the date format
          dream.date_format = date_format;

          // push the dream into the dreams array
          this.dreams[i] = dream;
          break;
        }

      }
    // new
    } else {
      // hash the dream into an ID
      dream.id = Date.now();

      // store the date format
      dream.date_format = date_format;

      // push the dream into the dreams array
      this.dreams.push(dream);
    }

    // save obj
    this.save();

    // return the dream object
    return dream;
  },

  save: function () {
    this.database.add("dreams", this.dreams);
  },

  loadBackupData: function (data) {
  //data = '{ "dreamcatcher": ' + data + '}';

  data = '{ "dreamcatcher": [{"date_format": "is this JSON string badly formatted too? do not think so"}] }';
  // FIXME - dealing with some badly formatted JSON - need to fix this first and add { dreamcatcher: [] } to the Array

  var json = data.evalJSON(true);
  Mojo.Log.error('ok weve got some json, whats the length?');
  Mojo.Log.error(json.dreamcatcher.length);

    var i = 0,
        dream = null;
    for (i; i < data.length; i = i + 1) {
      dream = data[i];

      Mojo.Log.error(dream.date_format);
    }
  },

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  }
};
