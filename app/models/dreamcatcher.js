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
}, null, true);
