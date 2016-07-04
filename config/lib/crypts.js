'use strict';
var crypto = require('crypto');

var algorithm = 'aes-256-cbc';
var hmacAlgorithm = 'sha256';
var key = process.env.key || '10000000000110000000000110101111';
var hmacKey = process.env.hmacKey || '10000000000110000000000110101111';

exports.encrypt = function(text) {
  var iv = new Buffer(crypto.randomBytes(16));
  var cipher = crypto.createCipheriv(algorithm, key, iv);
  var encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  var hmac = crypto.createHmac(hmacAlgorithm, hmacKey);
  hmac.update(encrypted);
  hmac.update(iv.toString('hex'));

  return encrypted+'@'+hmac.digest('hex')+'@'+iv.toString('hex');
};

exports.decrypt = function(encrypted, cb) {
  var cipherArray = encrypted.split('@');
  var encryptedText = cipherArray[0];
  var hmac = cipherArray[1];
  var iv = new Buffer(cipherArray[2], 'hex');

  var createHmac = crypto.createHmac(hmacAlgorithm, key, iv);
  createHmac.update(encryptedText);
  createHmac.update(iv.toString('hex'));

  if(!compare(createHmac.digest('hex'), hmac)) {
    cb(null);
  }

  var decrypted = crypto.createDecipheriv(algorithm, key, iv);
  cb(decrypted.update(encryptedText, 'hex', 'utf8'));
  //return decrypted.final('utf8');
};

function compare(val1, val2) {
  var beagle;

  if(val1.length !== val2.length) {
    return false;
  }
  for(var i=0; i<=(val1.length -1); i++) {
    if(val1.charCodeAt(i) === val2.charCodeAt(i)) {
      beagle = 0;
    } else {
      beagle = 1;
    }
  }
  return beagle === 0;
}
