#!/usr/bin/env node

const sys = require("sys");
const fs = require("fs");
const exec = require('child_process').exec;

/**
  Returns a function to be executed
  @param cmd {string} the command to run
  @param callback {Function} the Function to execute after the command finishes running
  */
var run = function (cmd, callback) {
  return function () {
    console.log("Now running: " + cmd);
    exec(cmd, function (err, stdout) {
      if (err) {
        throw err;
      }

      console.log(stdout);

      if (callback) {
        callback();
      }
    });
  }
},

/**
  Executes a set of instructions -- recursively builds using the run() function
  @param instructions {Array} the commands to execute
  @return Function
  */
build = function (instructions) {
  var cmd = null;

  if (instructions.length === 0) {
    return cmd;
  } else {
    cmd = instructions.shift();
    return run(cmd, build(instructions));
  }
};

/** Tasks */

task("install", [], function () {
  var launch = arguments[0] ? (arguments[0].launch) : false;

  // read version
  fs.readFile('application/appinfo.json', 'utf8', function (err, data) {
    if (err) {
      throw err;
    }

    var version = (function (appinfo) {
      return appinfo.version;
    }(JSON.parse(data))),

    instructions = [
      "palm-package application",
      "palm-install com.goatslacker.dreamcatcher_" + version + "_all.ipk"
    ],

    go = null;

    if (launch) {
      instructions.push("palm-launch com.goatslacker.dreamcatcher");
    }

    // build the instructions into an executable function
    go = build(instructions);

    // run the listed commands
    go();
  });

}, false);
