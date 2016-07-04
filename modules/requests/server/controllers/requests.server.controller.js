'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend request's controller
 */
module.exports = _.extend(
  require('./requests/requests.assign.server.controller'),
  require('./requests/requests.twitter.server.controller'),
  require('./requests/requests.linkedin.server.controller'),
  require('./requests/requests.tumblr.server.controller')
);