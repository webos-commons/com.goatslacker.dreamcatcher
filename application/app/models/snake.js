/**
Copyright (C) 2011 by Josh Perez
https://github.com/goatslacker/Snake

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
**//**
  * Snake - A JavaScript ORM/DBAL
  *
  * @author <a href="mailto:josh@goatslacker.com">Josh Perez</a>
  *//**
  * The Snake ORM/DBAL
  *
  * @namespace Snake
  * @this {Snake}
  */var Snake={version:"0.1.8",build:"alpha",global:this,debug:!1,config:{},log:function(a){console&&console.log(a)},interpolate:function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a=a.replace(new RegExp("#{"+c+"}","g"),typeof b[c][1]=="f"?b[c]():b[c]));return a}};Snake.base=function(a){function e(a,b){return function(c,e,f){d(a,b,c,e,f)}}function d(b,c,d,e,f){Snake.venom[c].retrieveByPK(b[a.foreign[c][0]],function(a){b[c]=function(b){b(a)},d.apply(null,arguments)},e,f)}var b=null,c=null;c=function(){for(var b in a.columns)a.columns.hasOwnProperty(b)&&(this[b]=null);if("foreign"in a)for(b in a.foreign)a.foreign.hasOwnProperty(b)&&(this[b]=e(this,b));this.old={}},c.allocate=function(a,b){var d=this instanceof c?b:new c,e=null;for(e in a)a.hasOwnProperty(e)&&(d[e]=a[e],d.old[e]=a[e]);return d},c.is=function(a){for(var b in a)a.hasOwnProperty(b)&&(this.prototype[b]=a[b])},b={save:function(b,c,d){var e=this,f=[],g=Snake.interpolate,h=null,i=[],j=0,k=0,l=null,m="";if(this.id&&this.id===this.old.id){for(j=0,k=a.map.length;j<k;j=j+1)this[a.map[j]]!==this.old[a.map[j]]&&(l=this[a.map[j]]||null,f.push(l),i.push(a.map[j]+" = ?"));m=g("UPDATE #{table} SET #{conditions} WHERE id = ?",{table:a.tableName,conditions:i}),f.push(this.id),h=function(a){b(e)}}else{for(j=0,k=a.map.length;j<k;j=j+1)l=this[a.map[j]]||null,a.map[j]==="created_at"&&l===null&&(l=Date.now()),f.push(l),i.push("?");m=g("INSERT INTO '#{table}' (#{columns}) VALUES (#{q})",{table:a.tableName,columns:a.map,q:i}),h=function(a){e.id=a,b&&b(e)}}d===!0?b&&b(m,f):Snake.query(m,f,h,c)},doDelete:function(b,c,d){Snake.venom[a.tableName].find(this.id).doDelete(b,c,d)}},c.is(b),c.prototype.$super=b;return c},Snake.venomousObject=function(a){var b={},c={},d=null,e=null,f=null;f=function(){c.sql={distinct:!1,select:[],from:a.tableName,joins:[],where:{criterion:[],params:[]},orderBy:[],groupBy:[],limit:!1}},e=function(){var d=arguments[0],e=arguments[1],f=arguments[2]||b.EQUAL,g=[],h=0,i=0;d in a.columns&&(d=a.tableName+"."+d);switch(f){case b.ISNULL:case b.ISNOTNULL:c.sql.where.criterion.push(d+" "+f);break;case b.IN:case b.NOTIN:for(h=0,i=e.length;h<i;h=h+1)g.push("?");c.sql.where.criterion.push(d+" "+f+" ("+g.join(", ")+")");break;default:c.sql.where.criterion.push(d+" "+f+" ?")}e&&(Array.isArray(e)?c.sql.where.params=c.sql.where.params.concat(e):c.sql.where.params.push(e))},d=function(b,d,e,g,h){var i=null,j=Snake.interpolate;e=e||{},e.from=a.tableName,c.sql.joins.length>0&&(d=d+" "+c.sql.joins.join(" ")),c.sql.where.criterion.length>0&&(d=d+" WHERE #{where}",e.where=c.sql.where.criterion.join(" AND "),i=c.sql.where.params),c.sql.orderBy.length>0&&(d=d+" ORDER BY #{orderBy}",e.orderBy=c.sql.orderBy),c.sql.groupBy.length>0&&(d=d+" GROUP BY #{groupBy}",e.groupBy=c.sql.groupBy),c.sql.limit&&(c.sql.offset?(d=d+" LIMIT #{offset}, #{limit}",e.offset=c.sql.offset):d=d+" LIMIT #{limit}",e.limit=c.sql.limit),b?Snake.query(j(d,e),i,g,h):g&&g(j(d,e),i),f()},b={EQUAL:"=",NOT_EQUAL:"<>",GREATER_THAN:">",LESS_THAN:"<",GREATER_EQUAL:">=",LESS_EQUAL:"<=",ISNULL:"IS NULL",ISNOTNULL:"IS NOT NULL",LIKE:"LIKE",NOTLIKE:"NOT LIKE",IN:"IN",NOTIN:"NOT IN",LEFT_JOIN:"LEFT JOIN"},c={select:function(){for(var b=0,c=arguments.length;b<c;b=b+1)arguments[b]in a.columns&&this.sql.select.push(a.tableName+"."+arguments[b]);return this},distinct:function(){this.sql.distinct=!0,this.select.apply(this,arguments);return this},find:function(){var a=null,c=null,d=null,f=null;if(arguments.length>1)a=arguments[0],c=arguments[1],c in b?d=b[c]:d=b[arguments[2]]||b.EQUAL,e(a,c,d);else if(typeof arguments[0]=="number")e("id",arguments[0]);else for(a in arguments[0])if(arguments[0].hasOwnProperty(a)){c=arguments[0][a];switch(Object.prototype.toString.call(c)){case"[object Array]":d=b.IN,e(a,c,d);break;case"[object RegExp]":d=b.LIKE,f=c.toString(),c=f,f=c.replace(/\W/g,""),c.substr(1,1)==="^"?c=f+"%":c.substr(-2,1)==="$"?c="%"+f:c="%"+f+"%",e(a,c,d);break;case"[object Object]":for(f in c)c.hasOwnProperty(f)&&(d=b[f]||b.EQUAL,e(a,c[f],d));break;default:d=b.EQUAL,e(a,c,d)}}return this},orderBy:function(b){var c=null,d="";for(c in b)b.hasOwnProperty(c)&&(d=b[c].toUpperCase(),c in a.columns&&(c=a.tableName+"."+c),this.sql.orderBy.push(c+" "+d));return this},groupBy:function(){var b=0,c=null;for(b=0;b<arguments.length;b=b+1)c=arguments[b],c in a.columns&&(c=a.tableName+"."+c),this.sql.groupBy.push(c);return this},join:function(c,d,e){var f=Snake.interpolate;e=b[e]||b.LEFT_JOIN,d?this.sql.joins.push(f("#{join_method} #{foreign_table} ON #{table}.#{primary_key} = #{foreign_table}.#{foreign_key}",{join_method:e,foreign_table:c,table:a.tableName,primary_key:d[0],foreign_key:d[1]})):"foreign"in a&&c in a.foreign&&this.sql.joins.push(f("#{join_method} #{foreign_table} ON #{table}.#{primary_key} = #{foreign_table}.#{foreign_key}",{join_method:e,foreign_table:c,table:a.tableName,primary_key:a.foreign[c][0],foreign_key:a.foreign[c][1]}));return this},offset:function(a){this.sql.offset=a;return this},limit:function(a){this.sql.limit=a;return this},retrieveByPK:function(a,b,c,d){this.find(a).doSelectOne(b,c,d)},doSelectOne:function(a,b,c){var d=null;c===!0?d=a:d=function(b){a&&(b.length>0?a(b[0]):a(null))},this.limit(1).doSelect(d,b,c)},doCount:function(a,b,c,e){c=(c||this.sql.distinct===!0)&&this.sql.select.length>0?"DISTINCT ":"";var f="SELECT COUNT("+c+"#{select}) AS count FROM #{from}",g=null,h={};this.sql.select.length===0?h.select="*":h.select=this.sql.select,e===!0?g=a:g=function(b){var c=b[0];a&&a(c.count)},d(!e,f,h,g,b)},doDelete:function(a,b,c){d(!c,"DELETE FROM #{from}",null,a,b)},doSelect:function(b,c,e){var f="SELECT #{select} FROM #{from}",g=null,h={};this.sql.select.length===0?h.select="*":(h.select=this.sql.distinct?"DISTINCT ":"",h.select=h.select+this.sql.select),e===!0?g=b:g=function(c){var d=[],e=0,f=0,g=null;if(c.length>0)for(e=0,f=c.length;e<f;e=e+1)g=Snake.global[a.jsName].allocate(c[e]),d.push(g);b&&b(d)},d(!e,f,h,g,c)}},f();return c},Snake.venom={};var venom=Snake.venom,vql=venom;Snake.driver="WebSQL",Snake.query=function(){function c(b,c){var d=Snake,e=d.config.database;b=b||function(){},c=c||function(){},a=openDatabase(e.name,e.version,e.displayName,e.size),a?b():c("Could not open database")}var a=null,b=null;b=function(b,d,e,f){var g=Snake;d=d||null,e=e||function(a,b){g.log(a),g.log(b)},f=f||function(a,b){g.log(a),g.log(b)},a?a.transaction(function(a){var c=null,h=null,i=0,j=0;Array.isArray(b)||(b=[b]),h=function(a,b){var c=null,d=0,f=0,g=null;try{c=b.insertId}catch(h){c=[],g=b.rows;if(g.length>0)for(d=0,f=g.length;d<f;d=d+1)c.push(g.item(d))}e(c)};for(i,j=b.length;i<j;i=i+1)c=b[i]+";",g.debug&&(g.log(c),d&&g.log(d)),a.executeSql(c,d,h,f)}):(g.log("Connecting to the database"),c(function(){Snake.query(b,d,e,f)}))};return b}(),Snake.loadFromJSON=function(a,b,c){function j(a){var c=[],d=0,e=0,f=null,g=null,h=null,i=null,j=[],k=[],l=[];for(d,e=a.length;d<e;d=d+1){k=[],l=[];for(f in a[d].columns)a[d].columns.hasOwnProperty(f)&&f!=="id"&&f!=="created_at"&&k.push(f+" "+a[d].columns[f].type);if("foreign"in a[d]){h=a[d].foreign;for(g in h)h.hasOwnProperty(g)&&(j=[],"delete"in a[d].columns[h[g][0]]&&j.push("ON DELETE "+a[d].columns[h[g][0]]["delete"]),"update"in a[d].columns[h[g][0]]&&j.push("ON DELETE "+a[d].columns[h[g][0]]["delete"]),l.push("FOREIGN KEY ("+h[g][0]+") REFERENCES "+g+"("+h[g][1]+") "+j.join("")));if("ref"in a[d])for(i in a[d].ref)a[d].ref.hasOwnProperty(i)&&j.push("ON "+i+" "+a[d].ref[i])}k=k.concat(["id INTEGER PRIMARY KEY AUTOINCREMENT","created_at INTEGER"],l),c.push(Snake.interpolate("CREATE TABLE IF NOT EXISTS '#{table}' (#{fields})",{table:a[d].tableName,fields:k}))}Snake.query(c,null,b)}var d=null,e=null,f=null,g=null,h=[],i=null;for(d in a)if(a.hasOwnProperty(d)){i=a[d],i.jsName=d,i.columns.id={type:"INTEGER"},i.columns.created_at={type:"INTEGER"},i.map=[];for(e in a[d].columns)a[d].columns.hasOwnProperty(e)&&(f=a[d].columns[e],"foreign"in f&&(i.foreign||(i.foreign={}),g=f.foreign.split("."),i.foreign[g[0]]=[e,g[1]]),i.map.push(e));h.push(i),Snake.venom[a[d].tableName]=new Snake.venomousObject(i),Snake.global[d]=new Snake.base(i)}c===!0?j(h):b&&b()}