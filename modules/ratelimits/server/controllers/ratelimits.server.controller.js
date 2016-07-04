'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend request's controller
 */
module.exports = _.extend(
  require('./ratelimits/ratelimits.assign.server.controller'),
  require('./ratelimits/ratelimits.twitter.server.controller'),
  require('./ratelimits/ratelimits.linkedin.server.controller')
);