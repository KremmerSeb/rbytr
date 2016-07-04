'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Post Schema
 */
var PostSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  tasks: [
    {
      target: { type: String, default: '' },
      moment: { type: String, default: '' }
    }
  ],
  files: [
    {
      fieldname: { type: String, default: '' },
      originalname: { type: String, default: '' },
      encoding: { type: String, default: '' },
      mimetype: { type: String, default: '' },
      size: { type: String, default: '' },
      bucket: { type: String, default: '' },
      key: { type: String, default: '' },
      acl: { type: String, default: '' },
      contentType: { type: String, default: '' },
      location: { type: String, default: '' },
      etag: { type: String, default: '' }
    }
  ],
  targets: {
    twitter: { 
      id: { type: String, default: '' }
    },
    linkedin: { 
      id: { type: String, default: '' }
    },
    tumblr: { 
      id: { type: String, default: '' }
    },
    soundcloud: { 
      id: { type: String, default: '' }
    },
    facebook: { 
      id: { type: String, default: '' }
    }
  },
  likes: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
      tasks: [
        {
          target: { type: String, default: '' },
          moment: { type: String, default: '' }
        }
      ]
    }
  ],
  shares: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User'
      },
      tasks: [
        {
          target: { type: String, default: '' },
          moment: { type: String, default: '' }
        }
      ]
    }
  ],
  comments: [ { type: Schema.ObjectId, ref: 'Post' } ],
  isComment:  { type: Boolean, default: false }
});

mongoose.model('Post', PostSchema);
