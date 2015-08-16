'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  SearchResult = mongoose.model('SearchResult'),
  _ = require('lodash');


/**
 * Find searchresult by id
 */
exports.searchresult = function(req, res, next, id) {
  SearchResult.load(id, function(err, searchresult) {
    if (err) return next(err);
    if (!searchresult) return next(new Error('Failed to load searchresult ' + id));
    req.searchresult = searchresult;
    next();
  });
};

/**
 * Find searchresult by searchURL
 */
exports.searchresultbyUrl = function(searchURL) {
  return SearchResult.find({'searchURL':searchURL}).sort({created:-1});
};

/**
 * Create an searchresult
 */
exports.create = function(searchResults, user) {
  var searchresult = new SearchResult(searchResults);
  searchresult.user = user;
  console.log('Save in progress in searchResult');
  searchresult.save(function(err) {
    if (err) {
      return {
        error: 'Cannot save the searchresult'
      };
    }
    console.log('Save Finished');
     return searchresult;

  });
};

/**
 * Update an searchresult
 */
exports.update = function(req, res) {
  var searchresult = req.searchresult;

  searchresult = _.extend(searchresult, req.body);
  console.log('Save in progress in searchResult');
  searchresult.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot update the searchresult'
      });
    }
    console.log('Save Finished');
    res.json(searchresult);

  });
};

/**
 * Delete an searchresult
 */
exports.destroy = function(req, res) {
  var searchresult = req.searchresult;

  searchresult.remove(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot delete the searchresult'
      });
    }
    res.json(searchresult);

  });
};

/**
 * Show an searchresult
 */
exports.show = function(req, res) {
  res.json(req.searchresult);
};

/**
 * List of searchresults
 */
exports.all = function(req, res) {
  SearchResult.find().sort('-created').populate('user', 'name username').exec(function(err, searchresults) {
    if (err) {
      return res.json(500, {
        error: 'Cannot list the searchresults'
      });
    }
    res.json(searchresults);

  });
};
