/*global Dream DreamTag Mojo Snake stemmer*/
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
    sort: false,
    alwaysOn: true,
    noDepot: false
  },

  // tmp vars
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
/*
    if (event.type === Mojo.Event.command) {
      switch(event.command) {
      case "help":
        // push help scene
        break;
      }
    }
*/
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

  deprecate: function (controller, onSuccess, onFailure) {
    var self = this;

    function deprecate(dreams) {

      controller.showAlertDialog({
        onChoose: function () {
          var dream = null,
              tags = [],
              i = 0,
              j = 0,
              tag = null;

          self.dreams = [];

          for (i = 0; i < dreams.length; i = i + 1) {
            dream = new Dream();
            dream.title = dreams[i].title;
            dream.summary = dreams[i].dream;
            dream.dream_date = dreams[i].date_format;
            dream.created_at = dreams[i].timestamp;

            self.dreams.push(dream);

            dream.save();
          }

          // dump the old database
          self.database.add('dreams', null);

          // set in prefs that we're not using depot anymore
          self.prefs.noDepot = true;
          self.savePrefs();

          if (onSuccess) {
            onSuccess();
          }

        },
        title: "Upgrading Application",
        message: "Dreamcatcher needs a minute or two to sort your dreams for the new search features. Do not close or restart the app until the process has completed.",
        choices: [{ label: "Continue", value: "cancel", type: 'affirmative'}]
      });

    }

    if (this.dreams.length === 0) {
      this.database.get('dreams', function (data) {
        if (data) {
          self.dreams = data;
          deprecate(self.dreams);
        } else {
          if (onFailure) {
            onFailure();
          }
        }
      });
    } else {
      deprecate(self.dreams);
    }

  },

  loadPrefs: function (onSuccess, onFailure) {
    var self = this;
    this.database.get('prefs', function (data) {
      var prefs = self.prefs,
          val = null;

      data = data || {};

      for (val in data) {
        if (data.hasOwnProperty(val)) {
          prefs[val] = data[val];
        }
      }

      if (onSuccess) {
        onSuccess(prefs);
      }
    }, onFailure);
  },

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  },

  retrieveLatest: function (callback, asc) {
    if (typeof asc === "undefined") {
      asc = this.prefs.sort;
    }
    Snake.venom.dreams.orderBy({ created_at: asc ? "asc" : "desc"}).doSelect(callback);
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

  doSearch: function (search_term, callback) {
    var words = search_term.split(" "),
        stemmed_words = [],
        i = 0,
        query = "",
        phrase = false,
        q = [];
    
    // there is more than 1 word.
    if (words.length > 1) {

      // we need to execute two queries, one for the entire term stemmed and replaced and then the loop of words
      phrase = stemmer(search_term.toLowerCase().replace(/[^a-zA-Z 0-9]+/g, '')); // FIXME regex
    }

    // single words
    for (i = 0; i < words.length; i = i + 1) {
      stemmed_words.push(stemmer(words[i].toLowerCase().replace(/[^a-zA-Z 0-9]+/g, ''))); // FIXME regex -- geez I should make this a func
      q.push("?");
    }

    // custom query
    query = "SELECT COUNT(*) AS nb, SUM(weight) AS total_weight, dreams.id, dreams.title, dreams.summary, dreams.dream_date, dreams.created_at FROM dreams_search, dreams WHERE dream_id = dreams.id AND stem IN (#{words}) GROUP BY dreams.id ORDER BY nb DESC, total_weight DESC";

    if (phrase !== false) {
      // run first query and the mix with second set of results
      Snake.query(query.interpolate({ words: "?" }), [phrase], function (dreams) {
        var lucid = [];
        lucid = lucid.concat(dreams);

        Snake.query(query.interpolate({ words: q }), stemmed_words, function (dreams) {
          lucid = lucid.concat(dreams);
          callback(lucid);
        });
      });
    } else {
      // hydrates a record set
      Snake.query(query.interpolate({ words: q }), stemmed_words, function (dreams) {
        callback(dreams);
      });
    }

  }

};
