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

  deprecate: function (callback) {
    // add
    if (this.prefs.noDepot === false) {

      if (this.dreams.length === 0) {
        this.database.get('dreams', (function (data) {
          if (data) {
            this.dreams = data;
          }
          this._deprecate(this.dreams, callback);
        }).bind(this));
      } else {
        this._deprecate(this.dreams, callback);
      }

    }
  },

  // TODO TEST - this should be working in theory. We only need to test it
  _deprecate: function (dreams, callback) {
    var i = 0
      , dream
      , dreams = [];

    for (i = 0; i < dreams.length; i = i + 1) {
      dream = new Dream();
      dream.title = dreams[i].title;
      dream.summary = dreams[i].dream;
      dream.dream_date = dreams[i].date_format;
      dream.created_at = dreams[i].timestamp;
  
      // TODO support tags?? -- use spaces or commas and prompt user for the rest of the tags?

      dream.save(); // TODO - need to return BOOLEAN here

      DreamsDB.updateSearchIndex(dream); // update the search index

      // if one of the dream fails, I need to capture which dream it is and do something with that dream.
      // perhaps have a mix of both SQL and Depot ... there should be no reason for this though.
      // either way we should test with all sorts of funky characters.

      dreams.push(dream);
    }

    // make sure there are no errors and then dump the database
    this.dreams = {};
    this.database.add('dreams', this.dreams);
    // if there are errors, then what?

    this.dreams = dreams;

    // set in prefs that we're not using depot anymore
    this.prefs.noDepot = true;
    this.savePrefs();

    if (callback) {
      callback();
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

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  },

  updateSearchIndex: function (dream) {
    dream = dream || new Dream();

    dream.title = dream.title || "";
    dream.summary = dream.summary || "";
    
    // get keywords and push them into an array repeated by weight...
    var summary = dream.summary.split(" ")
      , title = dream.title.split(" ")
      , keywords = title.concat(title, title, summary)
      , stop = [
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
        'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
        'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
        'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
        'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
        'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
        'than', 'too', 'very', 'put', 'also', 'other', 'gave', 'well', 'know', 'make', 'seen',
        'let', ''
      ]
      , splice = false
      , keys = []
      , i = 0
      , j = 0
      , c = null;

    // delete existing keywords
    c = new Snake.Criteria();
    c.add(DreamSearchPeer.DREAM_ID, dream.id);
    DreamSearchPeer.doDelete(c); // TODO test out doDelete

    // remove stop words

    // then remove all the stop words
    // and remove all sepcial chars, stem the words

    for (i = 0; i < keywords.length; i = i + 1) {
      for (j = 0; j < stop.length; j = j + 1) {
        if (stop[j] === keywords[i].toLowerCase()) {
          splice = true;
        }
      }

      if (!splice) {
        keys.push(stemmer(keywords[i].replace(/[^a-zA-Z 0-9]+/g,''))); // remove special chars, stem and push into keys
      }

      splice = false;
    }

    keys.sort();

    keywords = {};

    // add up the weights

    for (i = 0; i < keys.length; i = i + 1) {
      if (i > 0 && keys[i] === keys[i - 1]) {
        keywords[keys[i]]++;
      } else {
        keywords[keys[i]] = 1;
      }
    }

    console.log(keywords);

    // add to database!

    for (i in keywords) {
      if (keywords.hasOwnProperty(i)) {
        var ds = new DreamSearch();
        ds.dream_id = dream.id;
        ds.word = ""; // FIXME
        ds.stem = i;
        ds.weight = keywords[i];
        console.log(ds);
        //ds.save();
      }
    }
  }

};

