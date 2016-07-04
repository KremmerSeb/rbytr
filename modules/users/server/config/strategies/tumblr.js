'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  TumblrStrategy = require('passport-tumblr').Strategy,
  users = require('../../controllers/users.server.controller'),
  crypts = require('../../../../../config/lib/crypts');

module.exports = function (config) {
  // Use tumblr strategy
  passport.use(new TumblrStrategy({
    consumerKey: config.tumblr.clientID,
    consumerSecret: config.tumblr.clientSecret,
    callbackURL: config.tumblr.callbackURL,
    passReqToCallback: true
  },
  function (req, token, tokenSecret, profile, done) {
    // Set the provider data and include tokens
    var providerData = profile._json.response.user;
    providerData.token = token;
    providerData.tokenSecret = tokenSecret;
    providerData.blogIdentifier = profile._json.response.user.name+'.tumblr.com';

    var displayName = profile.username.trim();
    var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
    var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
    var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';

    var providerUserProfile = {
      firstName: firstName,
      lastName: 'init',
      displayName: displayName,
      username: profile.username,
      email: null,
      provider: 'tumblr',
      providerIdentifierField: 'id_str',
      providerData: providerData
    };
    
    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};
