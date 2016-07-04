'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  tasks = require(path.resolve('./config/lib/tasks'));

/**
 * Module init function.
 */
module.exports = function (app, db) {
  tasks();
};
