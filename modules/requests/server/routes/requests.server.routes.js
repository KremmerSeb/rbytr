'use strict';

/**
 * Module dependencies.
 */
var requestsPolicy = require('../policies/requests.server.policy'),
  Requests = require('../controllers/requests.server.controller');

module.exports = function (app) {
  // Requests target routes
  app.route('/api/requests/targets').all(requestsPolicy.isAllowed)
    .get(Requests.targets);
};