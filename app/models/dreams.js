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

  doSearch: function (search_term, callback) {
    var words = search_term.split(" ")
      , stemmed_words = []
      , i = 0
      , query = ""
      , phrase = false
      , q = [];
    
    // there is more than 1 word.
    if (words.length > 1) {

      // we need to execute two queries, one for the entire term stemmed and replaced and then the loop of words
      phrase = stemmer(search_term.toLowerCase().replace(/[^a-zA-Z 0-9]+/g,''));
    }

    // single words
    for (i = 0; i < words.length; i = i + 1) {
      stemmed_words.push(stemmer(words[i].toLowerCase().replace(/[^a-zA-Z 0-9]+/g,'')));
      q.push("?");
    }

    // custom query
    query = "SELECT COUNT(*) AS nb, SUM(weight) AS total_weight, dream.id, dream.title, dream.summary, dream.dream_date, dream.created_at FROM dream_search, dream WHERE dream_id = dream.id AND stem IN (#{words}) GROUP BY dream.id ORDER BY nb DESC, total_weight DESC";
    phrase = false;

    if (phrase !== false) {
      // run first query and the mix with second set of results
      Snake.query(query.interpolate({ words: "?" }), [phrase], Snake.hydrateRS.bind(this, DreamPeer, (function (dreams) {
        var all_dreams = [];
        all_dreams = all_dreams.concat(dreams);

        Snake.query(query.interpolate({ words: q }), stemmed_words, Snake.hydrateRS.bind(this, DreamPeer, (function (dreams) {
          callback(all_dreams);
        }).bind(this)));

      }).bind(this)));
    } else {
      // hydrates a record set
      Snake.query(query.interpolate({ words: q }), stemmed_words, Snake.hydrateRS.bind(this, DreamPeer, function (dreams) {
        callback(dreams);
      }));
    }

  },

  updateSearchIndex: function (dream) {
    dream = dream || new Dream();

    dream.title = dream.title || "";
    dream.summary = dream.summary || "";

    // get keywords and push them into an array repeated by weight...
    var summary = dream.summary.split(" ")
      , title = dream.title.split(" ")
      , tags = dream.tags
      , keywords = []
      , stop = [
        'i', 'im', 'ive', 'me', 'my', 'myself', 'we', 'weve', 'our', 'ours', 'ourselves', 'you', 'your', 
        'youre', 'youve', 'yours', 'yourself', 'yourselves', 'he', 'hes', 'hay', 'hey', 'him', 'his', 'himself', 'she', 
        'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'didnt',
        'can', 'cent', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'los',
        'was', 'take', 'aint', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
        'did', 'cause', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'will',
        'while', 'of', 'hi', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'makes', 'cannot',
        'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'else', 'ever',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'ago', 'give',
        'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'find', 'goes',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'must', 'wed',
        'than', 'too', 'very', 'put', 'also', 'other', 'gave', 'well', 'know', 'make', 'seen', 'shes',
        'let', ''
      ]
      , no_push = false
      , keys = []
      , keyword = null
      , index = {}
      , i = 0
      , j = 0
      , n = []
      , c = null;

    // delete existing keywords
    c = new Snake.Criteria();
    c.add(DreamSearchPeer.DREAM_ID, dream.id);
    DreamSearchPeer.doDelete(c);

    // remove stop words

    // then remove all the stop words
    // and remove all special chars, stem the words

    for (i = 0; i < summary.length; i = i + 1) {
      keyword = summary[i].replace(/[^a-zA-Z 0-9]+/g,'');

      for (j = 0; j < stop.length; j = j + 1) {
        if (stop[j] === keyword.toLowerCase()) {
          no_push = true;
        }
      }

      if (!no_push) {
        n.push(keyword);
      }

      no_push = false;
    }

    keywords = title.concat(title, title, n, tags, tags, tags);

    for (i = 0; i < keywords.length; i = i + 1) {
      if (keywords[i] && keywords[i].length >= 3) {
        // remove special chars, stem and push into keys
        var no_special_chars = keywords[i].replace(/[^a-zA-Z 0-9]+/g,'')
          , stemmed = stemmer(no_special_chars).toLowerCase();

        index[stemmed] = no_special_chars;
        keys.push(stemmed);
      }
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

    // add to database!
    for (i in keywords) {
      if (keywords.hasOwnProperty(i)) {
        var ds = new DreamSearch();
        ds.dream_id = dream.id;
        ds.word = index[i]; 
        ds.stem = i;
        ds.weight = keywords[i];
        ds.save();
      }
    }
  },

  retrieveLatest: function (callback, asc) {
    asc = asc || false;

    var c = new Snake.Criteria();
    if (asc) {
      c.addAscendingOrderByColumn(DreamPeer.CREATED_AT);
    } else {
      c.addDescendingOrderByColumn(DreamPeer.CREATED_AT);
    }
    DreamPeer.doSelect(c, callback);
  },

  loadBackupData: function (data, callback) {
    var json = data.evalJSON(true),
        i = 0,
        dream = null;

    for (i; i < json.dreams.length; i = i + 1) {
      dream = json.dreams[i];

      // add dreams to db
      this.post({
        title: dream.title,
        dream: dream.summary,
        timestamp: new Date(dream.created_at)
      });
    }

    if (callback) {
      callback();
    }
  },

  savePrefs: function () {
    this.database.add("prefs", this.prefs);
  }

};
