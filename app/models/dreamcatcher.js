Snake.loadFromJSON({
  Dream: {
    tableName: 'dream',
    "columns": {
      "title": { "type": "text" },
      "summary": { "type": "text" },
      "dream_date": { "type": "text" }
     }
  },

  DreamSearch: {
    tableName: 'dream_search',
    "columns": {
      "dream_id": { "type": "integer", "foreign": "dream.id"},
      "word": { "type": "text" },
      "stem": { "type": "text" },
      "weight": { "type": "integer" }
    }
  },

  DreamTag: {
    tableName: 'dream_tag',
    "columns": {
      "dream_id": { "type": "integer", "foreign": "dream.id" },
      "tag": { "type": "text" },
      "normalized": { "type": "text" }
    }
  }
});
