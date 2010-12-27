Snake.init({"database":{"name":"dreamcatcher","version":"0.1","displayName":"Dreamcatcher Database","size":100000000},"schema":{"dream":{"jsName":"Dream","columns":{"title":{"type":"text"},"summary":{"type":"text"},"dreamDate":{"type":"text"}}},"dream_search":{"jsName":"DreamSearch","columns":{"dream_id":{"type":"integer","foreign":"dream.id"},"word":{"type":"text"},"stem":{"type":"text"},"weight":{"type":"integer"}}},"dream_tag":{"jsName":"DreamTag","columns":{"dream_id":{"type":"integer","foreign":"dream.id"},"tag":{"type":"text"},"normalized":{"type":"text"}}}},"sql":["CREATE TABLE IF NOT EXISTS 'dream' (id INTEGER PRIMARY KEY, title TEXT, summary TEXT, dreamDate TEXT, created_at INTEGER)","CREATE TABLE IF NOT EXISTS 'dream_search' (id INTEGER PRIMARY KEY, dream_id INTEGER, word TEXT, stem TEXT, weight INTEGER, created_at INTEGER)","CREATE TABLE IF NOT EXISTS 'dream_tag' (id INTEGER PRIMARY KEY, dream_id INTEGER, tag TEXT, normalized TEXT, created_at INTEGER)"]});

var DreamPeer = new Snake.BasePeer({
  tableName: 'dream',
  jsName: 'Dream',
  ID: 'dream.id',
  CREATED_AT: 'dream.created_at',
  TITLE: 'dream.title',
  SUMMARY: 'dream.summary',
  DREAMDATE: 'dream.dreamDate',
  
  fields: {
    id: { type: 'INTEGER' }, created_at: { TYPE: 'INTEGER' },
    title: { type: 'text' },
    summary: { type: 'text' },
    dreamDate: { type: 'text' }
  },
  columns: [ 'id', 'title', 'summary', 'dreamDate', 'created_at' ]
});
var Dream = Snake.Base.extend({
  init: function () {
    this._super(DreamPeer);
  },
  id: null,
  created_at: null,
  title: null,
  summary: null,
  dreamDate: null,

  updateSearchIndex: function () {

    this.title = this.title || "";
    this.summary = this.summary || "";
    
    // get keywords and push them into an array repeated by weight...
    var summary = this.summary.split(" ")
      , title = this.title.split(" ")
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
    c.add(DreamSearchPeer.DREAM_ID, this.id);
    DreamSearchPeer.doDelete(c); // TODO doDelete

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
        ds.dream_id = this.id;
        ds.word = ""; // FIXME
        ds.stem = i;
        ds.weight = keywords[i];
        console.log(ds);
        //ds.save();
      }
    }

  }

});

var DreamSearchPeer = new Snake.BasePeer({
  tableName: 'dream_search',
  jsName: 'DreamSearch',
  ID: 'dream_search.id',
  CREATED_AT: 'dream_search.created_at',
  DREAM_ID: 'dream_search.dream_id',
  WORD: 'dream_search.word',
  STEM: 'dream_search.stem',
  WEIGHT: 'dream_search.weight',
  
  fields: {
    id: { type: 'INTEGER' }, created_at: { TYPE: 'INTEGER' },
    dream_id: { type: 'integer' },
    word: { type: 'text' },
    stem: { type: 'text' },
    weight: { type: 'integer' }
  },
  columns: [ 'id', 'dream_id', 'word', 'stem', 'weight', 'created_at' ]
});
var DreamSearch = Snake.Base.extend({
  init: function () {
    this._super(DreamSearchPeer);
  },
  id: null,
  created_at: null,
  dream_id: null,
  word: null,
  stem: null,
  weight: null
});

var DreamTagPeer = new Snake.BasePeer({
  tableName: 'dream_tag',
  jsName: 'DreamTag',
  ID: 'dream_tag.id',
  CREATED_AT: 'dream_tag.created_at',
  DREAM_ID: 'dream_tag.dream_id',
  TAG: 'dream_tag.tag',
  NORMALIZED: 'dream_tag.normalized',
  
  fields: {
    id: { type: 'INTEGER' }, created_at: { TYPE: 'INTEGER' },
    dream_id: { type: 'integer' },
    tag: { type: 'text' },
    normalized: { type: 'text' }
  },
  columns: [ 'id', 'dream_id', 'tag', 'normalized', 'created_at' ]
});
var DreamTag = Snake.Base.extend({
  init: function () {
    this._super(DreamTagPeer);
  },
  id: null,
  created_at: null,
  dream_id: null,
  tag: null,
  normalized: null
});
