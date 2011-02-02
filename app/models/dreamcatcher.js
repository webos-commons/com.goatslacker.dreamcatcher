Snake.init({"fileName":"dreamcatcher","database":{"name":"ext:dreamcatcher","version":"0.1","displayName":"Dreamcatcher Database","size":65356},"schema":{"dream":{"jsName":"Dream","columns":{"title":{"type":"text"},"summary":{"type":"text"},"dream_date":{"type":"text"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}}},"dream_search":{"jsName":"DreamSearch","columns":{"dream_id":{"type":"integer","foreign":"dream.id"},"word":{"type":"text"},"stem":{"type":"text"},"weight":{"type":"integer"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}}},"dream_tag":{"jsName":"DreamTag","columns":{"dream_id":{"type":"integer","foreign":"dream.id"},"tag":{"type":"text"},"normalized":{"type":"text"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}}}},"sql":["CREATE TABLE IF NOT EXISTS 'dream'(title text, summary text, dream_date text, id INTEGER, created_at INTEGER)","CREATE TABLE IF NOT EXISTS 'dream_search'(dream_id integer, word text, stem text, weight integer, id INTEGER, created_at INTEGER, FOREIGN KEY (dream_id) REFERENCES dream(id))","CREATE TABLE IF NOT EXISTS 'dream_tag'(dream_id integer, tag text, normalized text, id INTEGER, created_at INTEGER, FOREIGN KEY (dream_id) REFERENCES dream(id), FOREIGN KEY (dream_id) REFERENCES dream(id))"]});
var DreamPeer = new Snake.BasePeer({"tableName":"dream","jsName":"Dream","columns":["title","summary","dream_date","id","created_at"],"fields":{"title":{"type":"text"},"summary":{"type":"text"},"dream_date":{"type":"text"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}},"TITLE":"dream.title","SUMMARY":"dream.summary","DREAM_DATE":"dream.dream_date","ID":"dream.id","CREATED_AT":"dream.created_at"});
var DreamSearchPeer = new Snake.BasePeer({"tableName":"dream_search","jsName":"DreamSearch","columns":["dream_id","word","stem","weight","id","created_at"],"fields":{"dream_id":{"type":"integer"},"word":{"type":"text"},"stem":{"type":"text"},"weight":{"type":"integer"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}},"DREAM_ID":"dream_search.dream_id","WORD":"dream_search.word","STEM":"dream_search.stem","WEIGHT":"dream_search.weight","ID":"dream_search.id","CREATED_AT":"dream_search.created_at"});
var DreamTagPeer = new Snake.BasePeer({"tableName":"dream_tag","jsName":"DreamTag","columns":["dream_id","tag","normalized","id","created_at"],"fields":{"dream_id":{"type":"integer"},"tag":{"type":"text"},"normalized":{"type":"text"},"id":{"type":"INTEGER"},"created_at":{"type":"INTEGER"}},"DREAM_ID":"dream_tag.dream_id","TAG":"dream_tag.tag","NORMALIZED":"dream_tag.normalized","ID":"dream_tag.id","CREATED_AT":"dream_tag.created_at"});
var Dream = new Snake.Base(DreamPeer,{"title":null,"summary":null,"dream_date":null,"id":null,"created_at":null});
var DreamSearch = new Snake.Base(DreamSearchPeer,{"dream_id":null,"word":null,"stem":null,"weight":null,"id":null,"created_at":null});
var DreamTag = new Snake.Base(DreamTagPeer,{"dream_id":null,"tag":null,"normalized":null,"id":null,"created_at":null});