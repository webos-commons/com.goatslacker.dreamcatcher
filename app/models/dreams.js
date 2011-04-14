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
    email: "",
    alwaysOn: true,
    noDepot: false
  },

  curQuery: null,

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

  deprecate: function (controller, onDeprecateSuccess, onNoDeprecate) {
    if (this.dreams.length === 0) {
      this.database.get('dreams', (function (data) {
        if (data) {
          this.dreams = data;
          this._deprecate(this.dreams, controller, onDeprecateSuccess);
        } else {
          onNoDeprecate();
        }
      }).bind(this));
    } else {
      this._deprecate(this.dreams, controller, onDeprecateSuccess);
    }
  },

  _deprecate: function (dreams, controller, callback) {

    controller.showAlertDialog({
      onChoose: (function () {

        var dream = null
          , i = 0
          , tags = []
          , j = 0
          , tag = null;

        this.dreams = [];

        for (i = 0; i < dreams.length; i = i + 1) {
          dream = new Dream();
          dream.title = dreams[i].title;
          dream.summary = dreams[i].dream;
          dream.dream_date = dreams[i].date_format;
          dream.created_at = dreams[i].timestamp;

          this.dreams.push(dream);

          dream.save((function (i, model) {
            if (dreams[i].tags.length > 0) {

              tags = [];

              for (j = 0; j < dreams[i].tags.length; j = j + 1) {
                tag = new DreamTag();
                tag.dream_id = model.id;
                tag.tag = dreams[i].tags[j].replace(/[^a-zA-Z 0-9]+/g,'');
                tag.normalized = tag.tag.toLowerCase().split(" ").join("-");

                if (tag.tag) {
                  tag.save();
                  tags.push(tag.tag);
                }
              }

              model.tags = tags;
            }

            this.updateSearchIndex(model); 
          }).bind(this, i));
        }

        // dump the old database
        this.database.add('dreams', null);

        // set in prefs that we're not using depot anymore
        this.prefs.noDepot = true;
        this.savePrefs();

        if (callback) {
          callback();
        }

      }).bind(this),
      title: "Upgrading Application",
      message: "Dreamcatcher needs a minute or two to sort your dreams for the new search features. Do not close or restart the app until the process has completed.",
      choices:[{ label: "Continue", value:"cancel", type:'affirmative'}]
    });

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
  },

  retrieveLatest: function (callback, asc) {
    asc = asc || false;
    Snake.venom.dreams.orderBy({ id: asc ? "asc" : "desc"}).doSelect(callback);
  },

  loadBackupData: function (data, callback) {
    var json = data.evalJSON(true),
        i = 0,
        dream = null;

    for (i; i < json.dreams.length; i = i + 1) {
      dream = new Dream();
      data = json.dreams[i];

      dream.title = data.title;
      dream.summary = data.summary;
      dream.timestamp = new Date(data.created_at);
      dream.save();
    }

    if (callback) {
      callback();
    }
  },

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  }

};
