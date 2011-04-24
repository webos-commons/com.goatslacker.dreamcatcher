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
**/

/**
  * Snake - A JavaScript ORM/DBAL
  *
  * @author <a href="mailto:josh@goatslacker.com">Josh Perez</a>
  * @version 0.1.6
  */

/**
  * The Snake ORM/DBAL
  *
  * @namespace Snake
  * @this {Snake}
  */
var Snake = {
  version: "0.1.6",
  build: "alpha",
  global: this,
  debug: false,
  config: {},
  log: function (msg) {
    Mojo.Log.error(JSON.stringify(msg));
  },

  /**
    * Inserts a foreign object into a template.
    *
    * @param {string} str The string to interpolate
    * @param {Object} obj The foreign Object to interpolate into the string
    * @returns {string} The string interpolated with the object's values
    */
  interpolate: function (str, obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        str = str.replace(new RegExp('#{' + prop + '}', 'g'), typeof obj[prop][1] === 'f' ? obj[prop]() : obj[prop]);
      }
    }

    return str;
  },

  /**
    * Tests whether an Object is an array or not
    *
    * @param {Array} array_in_question The object to check
    @ @returns {boolean}
    */
  isArray: function (array_in_question) {
    return (Object.prototype.toString.call(array_in_question) === '[object Array]');
  }
};

/**
  * The base objects which we'll base our Models from
  *
  * @constructor
  * @param {Object} table The model's schema
  * @returns {Object} The model to use
  */
Snake.base = function (table) {
  var proto = null,
      Model = null;

  /**
    @private
    */
  function getForeignObj(that, ref, onSuccess, onFailure, output_sql) {
    // test
    Snake.venom[ref].retrieveByPK(that[table.foreign[ref][0]], function (result) {

      // change the func
      that[ref] = function (onSuccess) {
        onSuccess(result);
      };

      onSuccess.apply(null, arguments);
    }, onFailure, output_sql);
  }

  /**
    @private
    */
  function bindGetForeignObject(context, ref) {
    return function (onSuccess, onFailure, output_sql) {
      getForeignObj(context, ref, onSuccess, onFailure, output_sql);
    };
  }

  /**
    * @constructor
    */
  Model = function () {

    for (var name in table.columns) {
      if (table.columns.hasOwnProperty(name)) {
        // FIXME -- should add to object and then lock the obj
        this[name] = null;
      }
    }

    if ("foreign" in table) {
      for (name in table.foreign) {
        if (table.foreign.hasOwnProperty(name)) {
          this[name] = bindGetForeignObject(this, name);
        }
      }
    }

    this.old = {};

    //Object.seal(this); // Not sealing it for now
  };

  /**
    * Hydrates or populates a result set into the specified Model
    *
    * @public
    * 
    * @param {Array} row The result set of objects to populate into the model
    * @param {Object} model_obj Object that will be populated
    * @example
    * Model.allocate(result, new Fruits());
    * fruits.allocate(result);
    * @returns {Object} model The hydrated model
    */
  Model.allocate = function (row, model_obj) { // TODO - also handle multiple rows
    var model = (this instanceof Model) ? model_obj : new Model(),
        prop = null;

    for (prop in row) {
      if (row.hasOwnProperty(prop)) {
        model[prop] = row[prop];
        model.old[prop] = row[prop];
      }
    }

    return model;
  };

  /**
    * Allows a Model to have Mixins
    * 
    * @param {Object} extend The object to mix into the model
    */
  Model.is = function (extend) {
    // Copy the properties over onto the new prototype
    for (var name in extend) {
      if (extend.hasOwnProperty(name)) {
        this.prototype[name] = extend[name];
      }
    }
  };

  proto = {
  /** @lends Model.prototype */

    /**
      * Saves a record to the database
      *
      * @param {Function} onSuccess The callback to execute if the transaction completes successfully
      * @param {Function} onFailure The callback to execute if the transaction fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise the data is persisted to the database
      */
    save: function (onSuccess, onFailure, output_sql) {
      var model = this,
          values = [],
          interpolate = Snake.interpolate,
          q = [],
          i = 0,
          max = 0,
          val = null,
          sql = "";

      // update
      // FIXME - if new ID !== OLD ID then it's an INSERT
      if (this.id) {
        for (i = 0, max = table.map.length; i < max; i = i + 1) {
          if (this[table.map[i]] !== this.old[table.map[i]]) {
            val = this[table.map[i]] || null;
            values.push(val);

            q.push(table.map[i] + " = ?");
          }
        }

        sql = interpolate("UPDATE #{table} SET #{conditions} WHERE id = ?", {
          table: table.tableName,
          conditions: q
        });

        values.push(this.id);

      // insert
      } else {

        for (i = 0, max = table.map.length; i < max; i = i + 1) {
          val = this[table.map[i]] || null;
  
          if (table.map[i] === 'created_at' && val === null) {
            val = Date.now();
          }

          values.push(val);
          q.push("?");
        }

        sql = interpolate("INSERT INTO '#{table}' (#{columns}) VALUES (#{q})", {
          table: table.tableName,
          columns: table.map,
          q: q
        });
      }


      if (output_sql === true) {
        if (onSuccess) {
          onSuccess(sql, values);
        }

      } else {
        Snake.query(sql, values, function (id) {
          // set an ID
          model.id = id;

          if (onSuccess) {
            onSuccess(model);
          }
        }, onFailure);
      }

    },

    /**
      * Deletes a record from the database
      *
      * @param {Function} onSuccess The callback to execute if the transaction completes successfully
      * @param {Function} onFailure The callback to execute if the transaction fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise the data is persisted to the database
      */
    doDelete: function (onSuccess, onFailure, output_sql) {
      Snake.venom[table.tableName].find(this.id).doDelete(onSuccess, onFailure, output_sql);

      // loop through linked foreign objects and delete those using the FK!
    }
  };

  Model.is(proto);

  Model.prototype.$super = proto;

  return Model;
};

/**
  * Creates the `Query Building` object which is used to extract data from the database
  *
  * @constructor
  * @param {Object} schema The object's schema
  * @returns {Object}
  */
Snake.venomousObject = function (schema) {
  /**
    * @private
    */
  var SELECTORS = {},
      Collection = {},
      queryBuilder = null,
      addWhere = null,
      resetObj = null;

  /**
    * @private
    * Resets the Query after it returns a result
    */
  resetObj = function () {
    Collection.sql = {
      distinct: false,
      select: [],
      from: schema.tableName,
      joins: [],
      where: {
        criterion: [],
        params: []
      },
      orderBy: [],
      groupBy: [],
      limit: false
    };
  };

  /**
    * @private
    * Adds a WHERE statement to the query
    */
  addWhere = function () {
    var field = arguments[0],
        value = arguments[1],
        selector = arguments[2] || SELECTORS.EQUAL,
        q = [],
        i = 0,
        max = 0;

    if (field in schema.columns) {
      field = schema.tableName + "." + field;
    }

    switch (selector) {
    case SELECTORS.ISNULL:
    case SELECTORS.ISNOTNULL:
      Collection.sql.where.criterion.push(field + " " + selector);
      break;

    case SELECTORS.IN:
    case SELECTORS.NOTIN:
      for (i = 0, max = value.length; i < max; i = i + 1) {
        q.push("?");
      }

      Collection.sql.where.criterion.push(field + " " + selector + " (" + q.join(", ") + ")");
      break;

    default:
      Collection.sql.where.criterion.push(field + " " + selector + " ?");
    }

    if (value) {
      if (Snake.isArray(value)) {
        Collection.sql.where.params = Collection.sql.where.params.concat(value);
      } else {
        Collection.sql.where.params.push(value);
      }
    }
  };

  /**
    * @private
    * Builds the query and passes it onto Snake.query for processing
    */
  queryBuilder = function (persist, sql, query, onSuccess, onFailure) {
    var params = null,
        interpolate = Snake.interpolate;

    query = query || {};

    // FROM
    query.from = schema.tableName;

    if (Collection.sql.joins.length > 0) {
      sql = sql + " " + Collection.sql.joins.join(" ");
    }

    // WHERE
    if (Collection.sql.where.criterion.length > 0) {
      sql = sql + " WHERE #{where}";
      // build the where...
      query.where = Collection.sql.where.criterion.join(" AND ");

      params = Collection.sql.where.params;
    }

    // ORDER BY
    if (Collection.sql.orderBy.length > 0) {
      sql = sql + " ORDER BY #{orderBy}";
      query.orderBy = Collection.sql.orderBy;
    }

    // GROUP BY
    if (Collection.sql.groupBy.length > 0) {
      sql = sql + " GROUP BY #{groupBy}";
      query.groupBy = Collection.sql.groupBy;
    }

    // LIMIT && OFFSET
    if (Collection.sql.limit) {
      if (Collection.sql.offset) {
        sql = sql + " LIMIT #{offset}, #{limit}";
        query.offset = Collection.sql.offset;
      } else {
        sql = sql + " LIMIT #{limit}";
      }

      query.limit = Collection.sql.limit;
    }

    // We run the query
    if (persist) {
      Snake.query(interpolate(sql, query), params, onSuccess, onFailure);

    // use the callback to return the query
    } else {
      if (onSuccess) {
        onSuccess(interpolate(sql, query), params);
      }
    }

    resetObj();
  };

  /**
    * @private
    * @constant
    */
  SELECTORS = {
    EQUAL: "=", 
    NOT_EQUAL: "<>",
    GREATER_THAN: ">", 
    LESS_THAN: "<", 
    GREATER_EQUAL: ">=", 
    LESS_EQUAL: "<=",
    ISNULL: "IS NULL",
    ISNOTNULL: "IS NOT NULL",
    LIKE: "LIKE",
    NOTLIKE: "NOT LIKE",
    "IN": "IN",
    NOTIN: "NOT IN",
    LEFT_JOIN: "LEFT JOIN"
  };

  /**
    * @public
    * @constructor
    * @this {Collection} The collection object - in order to chain calls
    */
  Collection = {
    /**
      * Adds select columns to the query
      *
      * @param {string} arguments The field names to select
      * @example
      * SELECT nebulas, black_holes, stars FROM galaxies;
      * vql.galaxies.select("nebulas", "black_holes", "stars").doSelect(callback);
      * @returns {Object} this 
      */
    select: function () {
      for (var i = 0, max = arguments.length; i < max; i = i + 1) {
        if (arguments[i] in schema.columns) {
          this.sql.select.push(schema.tableName + "." + arguments[i]);
        }
      }

      return this;
    },

    /**
      * Prefixes the SQL statement with DISTINCT in order to filter out the duplicate entries
      *
      * @param {string} arguments The field names to apply select to
      * @example
      * SELECT DISTINCT nebulas, black_holes, stars FROM galaxies;
      * vql.galaxies.distinct("nebulas", "black_holes", "stars").doSelect(callback);
      * @returns {Object} this 
      */
    distinct: function () {
      this.sql.distinct = true;
      this.select.apply(this, arguments);
      return this;
    },

    /**
      * Filters the results by the criteria specified
      *
      * @param {string} arguments
      * @example
      * SELECT * FROM fruits WHERE name = 'mango';
      * vql.fruits.find({ name: "mango" }).doCount(callback);
      * vql.fruits.find("name", "mango").doCount(callback);
      * @returns {Object} this 
      */
    find: function () {
      var field = null,
          value = null,
          selector = null,
          tmp = null;

      // if we're passing each argument
      if (arguments.length > 1) {
        // first argument is the field
        field = arguments[0];
        // second argument should be the value
        value = arguments[1];

        // unless the value is actually a selector
        if (value in SELECTORS) {
          selector = SELECTORS[value];

        // otherwise the third argument is the selector
        } else {
          selector = SELECTORS[arguments[2]] || SELECTORS.EQUAL;
        }

        addWhere(field, value, selector);

      // we're not passing each argument
      } else {

        // Pull by ID
        if (typeof(arguments[0]) === "number") {

          addWhere("id", arguments[0]);

        // It's an object
        } else {

          // loop through each field
          for (field in arguments[0]) {

            if (arguments[0].hasOwnProperty(field)) {
              // the value is the property of the field
              value = arguments[0][field];

              switch (Object.prototype.toString.call(value)) {
              // if the value is an Array then we perform an IN query
              case "[object Array]":
                selector = SELECTORS.IN;
                addWhere(field, value, selector);
                break;

              // if the value is a Regular Expression then we perform a LIKE query
              case "[object RegExp]": 
                // TODO - NOT LIKE
                selector = SELECTORS.LIKE;
                tmp = value.toString();
                value = tmp;
                tmp = value.replace(/\W/g, "");

                if (value.substr(1, 1) === '^') {
                  value = tmp + '%';
                } else if (value.substr(-2, 1) === '$') {
                  value = '%' + tmp;
                } else {
                  value = '%' + tmp + '%';
                }

                addWhere(field, value, selector);
                break;

              // if the value is an Object then we need to loop through all the items in the object and set them for the current field
              case "[object Object]":
                for (tmp in value) {
                  if (value.hasOwnProperty(tmp)) {
                    selector = SELECTORS[tmp] || SELECTORS.EQUAL;

                    addWhere(field, value[tmp], selector);
                  }
                }
                break;

              // by default the selector is =
              default:
                selector = SELECTORS.EQUAL;
                addWhere(field, value, selector);
              }
            }

          } // loop

        } // typeof num

      } // endif

      return this;
    },

    /**
      * Orders the result set in ascending or descending order by a column
      *
      * @param {Object} obj The fields to order by along with their order
      * @example
      * SELECT * FROM tasks ORDER BY priority DESC;
      * vql.tasks.orderBy({ priority: 'desc' }).doSelect(callback);
      * @returns {Object} this 
      */
    orderBy: function (obj) {
      var column = null,
          sortOrder = "";
      for (column in obj) {
        if (obj.hasOwnProperty(column)) {
          sortOrder = obj[column].toUpperCase();
          if (column in schema.columns) {
            column = schema.tableName + "." + column;
          }
          this.sql.orderBy.push(column + " " + sortOrder);
        }
      }

      return this;
    },

    /**
      * Groups results by a column specified
      *
      * @param {string} arguments The fields to group by
      * @example
      * SELECT * FROM population GROUP BY ethnicity;
      * vql.population.groupBy('ethnicity');
      * @returns {Object} this 
      */
    groupBy: function () {
      var i = 0,
          column = null;

      for (i = 0; i < arguments.length; i = i + 1) {
        column = arguments[i];
        if (column in schema.columns) {
          column = schema.tableName + "." + column;
        }
        this.sql.groupBy.push(column);
      }

      return this;
    },

    /**
      * Joins two tables together using the table's primary and foreign keys
      * TODO params
      * @returns {Object} this 
      */
    join: function (table, on, join_method) {
      var interpolate = Snake.interpolate;

      join_method = SELECTORS[join_method] || SELECTORS.LEFT_JOIN;

      // find relationship and join the tables
      if (!on) {
        // this.join(vql.Deck);
        if ("foreign" in schema && table in schema.foreign) {
          this.sql.joins.push(interpolate("#{join_method} #{foreign_table} ON #{table}.#{primary_key} = #{foreign_table}.#{foreign_key}", {
            join_method: join_method,
            foreign_table: table,
            table: schema.tableName,
            primary_key: schema.foreign[table][0],
            foreign_key: schema.foreign[table][1]
          }));
        }
      // join it on the parameters provided
      } else {
        this.sql.joins.push(interpolate("#{join_method} #{foreign_table} ON #{table}.#{primary_key} = #{foreign_table}.#{foreign_key}", {
          join_method: join_method,
          foreign_table: table,
          table: schema.tableName,
          primary_key: on[0],
          foreign_key: on[1]
        }));
      }

      return this;
    },

    /**
      * Provides an offset or 'skips' a number of records
      *
      * @param {number} offset The number of records to skip
      * @example
      * SELECT * FROM cars LIMIT 5, 10;
      * vql.cars.offset(5).limit(10).doSelect(callback);
      * @returns {Object} this
      */
    offset: function (offset) {
      this.sql.offset = offset;
      return this;
    },

    /**
      * Limits the return result set to a set number of records
      *
      * @param {number} limit The number of records to return
      * @example
      * SELECT * FROM cars LIMIT 10;
      * vql.cars.limit(10).doSelect(callback);
      * @returns {Object} this
      */
    limit: function (limit) {
      this.sql.limit = limit;
      return this;
    },

    /**
      * Retrieves one record by the current collection's primary key
      *
      * @param {number} pk The primary key to retrieve from the database
      * @param {Function} onSuccess The function to callback once the operation completes successfully
      * @param {Function} onFailure The function to callback if the operation fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise we attempt to retrieve the data from the database
      */
    retrieveByPK: function (pk, onSuccess, onFailure, output_sql) {
      this.find(pk).doSelectOne(onSuccess, onFailure, output_sql);
    },

    /**
      * Retrieves one record from the database from the specified criteria 
      *
      * @param {Function} onSuccess The function to callback once the operation completes successfully
      * @param {Function} onFailure The function to callback if the operation fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise we attempt to retrieve the data from the database
      */
    doSelectOne: function (onSuccess, onFailure, output_sql) {
      var callback = null;

      if (output_sql === true) {
        callback = onSuccess;
      } else {
        /** @private */
        callback = function (rows) {
          if (onSuccess) {
            if (rows.length > 0) {
              onSuccess(rows[0]);
            } else {
              onSuccess(null);
            }
          }
        };
      }

      this.limit(1).doSelect(callback, onFailure, output_sql);
    },

    /**
      * Returns the number of records for a given criteria
      *
      * @param {Function} onSuccess The function to callback once the operation completes successfully
      * @param {Function} onFailure The function to callback if the operation fails
      * @param {boolean} useDistinct If true the COUNT is performed as distinct
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise we attempt to retrieve the data from the database
      */
    doCount: function (onSuccess, onFailure, useDistinct, output_sql) {
      useDistinct = ((useDistinct || this.sql.distinct === true) && this.sql.select.length > 0) ? "DISTINCT " : "";
      var sql = "SELECT COUNT(" + useDistinct + "#{select}) AS count FROM #{from}",
          callback = null,
          query = {};

      if (this.sql.select.length === 0) {
        query.select = "*";
      } else {
        query.select = this.sql.select;
      }

      if (output_sql === true) {
        callback = onSuccess;
      } else {
        /** @private */
        callback = function (results) {
          var obj = results[0];

          if (onSuccess) {
            onSuccess(obj.count);
          }
        };
      }

      queryBuilder(!output_sql, sql, query, callback, onFailure);
    },

    /**
      * Deletes an object from the database
      *
      * @param {Function} onSuccess The function to callback once the operation completes successfully
      * @param {Function} onFailure The function to callback if the operation fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise we attempt to retrieve the data from the database
      */
    doDelete: function (onSuccess, onFailure, output_sql) {
      queryBuilder(!output_sql, "DELETE FROM #{from}", null, onSuccess, onFailure);
    },

    /**
      * Returns an Array of objects for the specified criteria
      *
      * @param {Function} onSuccess The function to callback once the operation completes successfully
      * @param {Function} onFailure The function to callback if the operation fails
      * @param {boolean} output_sql If true the SQL is returned to the onSuccess callback as a string, otherwise we attempt to retrieve the data from the database
      */
    doSelect: function (onSuccess, onFailure, output_sql) {
      var sql = "SELECT #{select} FROM #{from}",
          callback = null,
          query = {};

      if (this.sql.select.length === 0) {
        query.select = "*";
      } else {
        query.select = this.sql.distinct ? "DISTINCT " : "";
        query.select = query.select + this.sql.select;
      }

      if (output_sql === true) {
        callback = onSuccess;
      } else {
        /** @private */
        callback = function (results) {
          var arr = [],
              i = 0,
              max = 0,
              model = null;
          
          if (results.length > 0) {
            for (i = 0, max = results.length; i < max; i = i + 1) {
              model = Snake.global[schema.jsName].allocate(results[i]);
              arr.push(model);
            }
          }

          if (onSuccess) {
            onSuccess(arr);
          }
        };
      }

      queryBuilder(!output_sql, sql, query, callback, onFailure);
    }

  };

  resetObj();

  return Collection;
};

Snake.venom = {};

var venom = Snake.venom,
    vql = venom;

Snake.driver = "WebSQL";

/**
  * Performs a query on the Web Database
  *
  * @function
  * @param {string} query A prepared statement
  * @param {Array} params The parameters to insert into the prepared statements
  * @param {Function} onSuccess The function to callback if the transaction is successfully executed
  * @param {Function} onFailure The function to callback if the transaction fails
  */
Snake.query = (function () {
// TODO support versioning

/**
  * @private
  */
  var database = null,
      Query = null;

/**
  * @private
  */
  function connect(onSuccess, onFailure) {
    var self = Snake,
        db = self.config.database;

    // defaults
    onSuccess = onSuccess || function () {};
    onFailure = onFailure || function () {};

    // HTML5 openDatabase
    database = openDatabase(db.name, db.version, db.displayName, db.size);

    // callbacks
    if (!database) {
      onFailure("Could not open database");
    } else {
      onSuccess();
    }
  }

  /**
    * @private
    */
  Query = function (query, params, onSuccess, onFailure) {
    var self = Snake;

    // defaults
    params = params || null;

    onSuccess = onSuccess || function (transaction, results) {
      self.log(transaction);
      self.log(results);
    };
    onFailure = onFailure || function (transaction, error) {
      self.log(transaction);
      self.log(error);
    };

    if (!database) {
      self.log("Connecting to the database");
      connect(function () {
        Snake.query(query, params, onSuccess, onFailure);
      });
    } else {
    
      // HTML5 database perform query
      database.transaction(function (transaction) {
        var preparedQuery = null,
            callback = null,
            i = 0,
            max = 0;

        // convert to single array
        if (!self.isArray(query)) {
          query = [query];
        }

        /**
          @private
          */
        callback = function (transaction, results) {
          var result = null,
              i = 0,
              max = 0,
              rows = null;

          try {
            result = results.insertId;
          } catch (e) {
            result = [];
            rows = results.rows;

            if (rows.length > 0) {
              for (i = 0, max = rows.length; i < max; i = i + 1) {
                result.push(rows.item(i));
              }
            }
          }
          
          onSuccess(result);
        };

        for (i, max = query.length; i < max; i = i + 1) {

          // append semicolon to query
          preparedQuery = query[i] + ";";

          // debugging
          if (self.debug) {
            self.log(preparedQuery);
            if (params) {
              self.log(params);
            }
          }

          // perform query
          transaction.executeSql(preparedQuery, params, callback, onFailure);
        }

      });
    }
  };

  return Query;
}());

/**
  * Dynamically builds the Models
  *
  * @param {Object} schema The schema in JSON format
  * @param {Function} onComplete The callback function to execute once the schema finishes building
  * @param {boolean} create_tables If set the true the tables will be automatically created for you if they don't exist
  */
Snake.loadFromJSON = function (schema, onComplete, create_tables) {
  var table = null,
      column = null,
      def_column = null,
      fk = null,
      models = [],
      model = null;

  for (table in schema) {
    if (schema.hasOwnProperty(table)) {
      model = schema[table];

      model.jsName = table;
      model.columns.id = { type: "INTEGER" };
      model.columns.created_at = { type: "INTEGER" };

      model.map = [];
      for (column in schema[table].columns) {
        if (schema[table].columns.hasOwnProperty(column)) {
          def_column = schema[table].columns[column];

          if ("foreign" in def_column) {
            if (!model.foreign) {
              model.foreign = {};
            }

            fk = def_column.foreign.split(".");
            model.foreign[fk[0]] = [column, fk[1]];
          }

          model.map.push(column);
        }
      }

      // TODO create relationships for the base objects
      // TODO create doSelectJoins for the relationships
     
      models.push(model);

      Snake.venom[schema[table].tableName] = new Snake.venomousObject(model);
      Snake.global[table] = new Snake.base(model);
    }
  }

  function sqlCreateTables(models) {
    var queries = [],
        i = 0,
        max = 0,
        column = null,
        foreign = null,
        foreign_key = null,
        refaction = null,
        ref = [],
        fields = [],
        fk = [];

    for (i, max = models.length; i < max; i = i + 1) {
      fields = [];
      fk = [];

      for (column in models[i].columns) {
        if (models[i].columns.hasOwnProperty(column)) {
          if (column !== "id" && column !== "created_at") {
            fields.push(column + " " + models[i].columns[column].type);
          }
        }
      }

      if ("foreign" in models[i]) {
        foreign_key = models[i].foreign;
        for (foreign in foreign_key) {
          if (foreign_key.hasOwnProperty(foreign)) {
            ref = [];

            if ("delete" in models[i].columns[foreign_key[foreign][0]]) {
              ref.push("ON DELETE " + models[i].columns[foreign_key[foreign][0]]["delete"]);
            }

            if ("update" in models[i].columns[foreign_key[foreign][0]]) {
              ref.push("ON DELETE " + models[i].columns[foreign_key[foreign][0]]["delete"]);
            }

            fk.push("FOREIGN KEY (" + foreign_key[foreign][0] + ") REFERENCES " + foreign + "(" + foreign_key[foreign][1] + ") " + ref.join(""));
          }
        }

        if ("ref" in models[i]) {
          for (refaction in models[i].ref) {
            if (models[i].ref.hasOwnProperty(refaction)) {
              ref.push("ON " + refaction + " " + models[i].ref[refaction]);
            }
          }
        }

      }

      fields = fields.concat(["id INTEGER PRIMARY KEY AUTOINCREMENT", "created_at INTEGER"], fk);
      
      queries.push(Snake.interpolate("CREATE TABLE IF NOT EXISTS '#{table}' (#{fields})", {
        table: models[i].tableName,
        fields: fields
      }));
    }

    Snake.query(queries, null, onComplete);
  }

  if (create_tables === true) {
    sqlCreateTables(models);
  } else {
    if (onComplete) {
      onComplete();
    }
  }
};

(function () { Snake.debug = true; }());
