'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Article Schema
 */
var SearchResultSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  searchURL: {
    type: String,
    trim: true
  },
  resultsHTML: {
    type: String,
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

/**
 * Validations
 */
SearchResultSchema.path('searchURL').validate(function(searchURL) {
  return !!searchURL;
}, 'Title cannot be blank');

/**
 * Statics
 */
SearchResultSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('SearchResult', SearchResultSchema);
