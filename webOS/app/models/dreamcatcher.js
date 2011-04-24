// define the db properties
Snake.config.database = { name: "ext:dreamcatcher", size: 65000, description: "Dreamcatcher Database", version: "0.1" };

Snake.loadFromJSON({
  Dream: {
    tableName: 'dreams',
    "columns": {
      "title": { "type": "text" },
      "summary": { "type": "text" },
      "dream_date": { "type": "text" }
     }
  },

  DreamSearch: {
    tableName: 'dreams_search',
    "columns": {
      "dream_id": { "type": "integer", "foreign": "dreams.id"},
      "word": { "type": "text" },
      "stem": { "type": "text" },
      "weight": { "type": "integer" }
    }
  },

  DreamTag: {
    tableName: 'dreams_tags',
    "columns": {
      "dream_id": { "type": "integer", "foreign": "dreams.id" },
      "tag": { "type": "text" },
      "normalized": { "type": "text" }
    }
  }
}, function () {
  /**
    Extend dream to perform some operations
    */
  Dream.is({

    updateSearchIndex: function () {
      this.title = this.title || "";
      this.summary = this.summary || "";

      // get keywords and push them into an array repeated by weight...
      var summary = this.summary.split(" "),
          title = this.title.split(" "),
          tags = this.tags,
          keywords = [],
          stop = [
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
        ],
          no_push = false,
          keys = [],
          keyword = null,
          index = {},
          i = 0,
          j = 0,
          n = [],
          c = null;

      // delete existing keywords
      Snake.venom.dreams_search.find({ dream_id: this.id }).doDelete();

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

      // weight
      keywords = title.concat(title, title, n, tags, tags, tags);

      for (i = 0; i < keywords.length; i = i + 1) {
        if (keywords[i] && keywords[i].length >= 3) {
          // remove special chars, stem and push into keys
          var no_special_chars = keywords[i].replace(/[^a-zA-Z 0-9]+/g, ''), // FIXME regex
              stemmed = stemmer(no_special_chars).toLowerCase();

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
          ds.dream_id = this.id;
          ds.word = index[i]; 
          ds.stem = i;
          ds.weight = keywords[i];
          ds.save();
        }
      }
    },

    save: function (onSuccess, onFailure, output_sql) {
      var self = this;

      this.$super.save.call(this, function (dream) {
        // update the index
        self.updateSearchIndex();

        var i = 0,
            tag = null;

        dream.tags = dream.tags || [];

        // delete all tags prior to updating...
        Snake.venom.dreams_tags.find({ dream_id: dream.id }).doDelete();

        // if there are tags, add them to the tags db
        if (dream.tags.length > 0) {
          for (i = 0; i < dream.tags.length; i = i + 1) {
            tag = new DreamTag();
            tag.dream_id = dream.id;

            tag.tag = dream.tags[i].replace(/[^a-zA-Z 0-9]+/g, ''); // FIXME Regex
            tag.normalized = tag.tag.toLowerCase().split(" ").join("-");
            tag.save();
          }
        }

        if (onSuccess) {
          onSuccess(dream);
        }
      }, onFailure, output_sql);

    }
  });
}, true);
