'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  DropboxStrategy = require('passport-dropbox').Strategy,
  users = require('../../controllers/users.server.controller'),
  crypts = require('../../../../../config/lib/crypts');

module.exports = function (config) {
  // Use dropbox strategy
  passport.use(new DropboxStrategy({
    consumerKey: config.dropbox.clientID,
    consumerSecret: config.dropbox.clientSecret,
    callbackURL: config.dropbox.callbackURL
  },
  function (req, token, tokenSecret, profile, done) {
    /*
    // Set the provider data and include tokens
    var providerData = profile._json;
    providerData.token = token;
    providerData.tokenSecret = tokenSecret;
    
    // Create the user OAuth profile
    var displayName = profile.displayName.trim();
    var iSpace = displayName.indexOf(' '); // index of the whitespace following the firstName
    var firstName = iSpace !== -1 ? displayName.substring(0, iSpace) : displayName;
    var lastName = iSpace !== -1 ? displayName.substring(iSpace + 1) : '';
    var providerId = profile._json.id_str;

    var providerUserProfile = {
      firstName: firstName,
      lastName: lastName,
      displayName: displayName,
      username: profile.username,
      profileImageURL: profile.photos[0].value.replace('normal', 'bigger'),
      provider: 'twitter',
      providerIdentifierField: 'id_str',
      providerData: providerData
    };

    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);
    */
  }));
};
