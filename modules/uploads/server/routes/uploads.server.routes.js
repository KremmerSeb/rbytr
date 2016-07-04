'use strict';

/**
 * Module dependencies.
 */
var uploadsPolicy = require('../policies/uploads.server.policy'),
  uploads = require('../controllers/uploads.server.controller');

module.exports = function (app) {
  // Uploads collection routes
  app.route('/api/uploads').all(uploadsPolicy.isAllowed)
    .post(uploads.handleAWS);
};
