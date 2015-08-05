'use strict';

/**
 * Module dependencies.
 */
var 

mongoose = require('mongoose'),
SearchResult = mongoose.model('SearchResult'),
  _ = require('lodash');


module.exports = function(SearchResult) {

    return {
        /**
         * Find Search result by id
         */
        searchresult: function(req, res, next, id) {
            SearchResult.load(id, function(err, searchresult) {
              if (err) return next(err);
              if (!searchresult) return next(new Error('Failed to load searchresult ' + id));
              req.searchresult = searchresult;
              next();
            });
        },
        /**
         * Find Search result by url
         */
        searchresultbyUrl : function(searchURL) {
          return SearchResult.find({'searchURL':searchURL}).sort({created:-1});
        },

        /**
         * Create an searchresult
         */
        create: function(req, res) {
            
            var searchresult = new SearchResult(req.body);
            searchresult.user = req.user;
            console.log('Save in progress in searchResult');
            searchresult.save(function(err) {
              if (err) {
                return {
                  error: 'Cannot save the searchresult'
                };
              }
              console.log('Save Finished');
              SearchResult.events.publish('create', {
                    description: req.user.name + ' created ' + req.body.title + ' searchresult.'
                });
              return res.json(searchresult);

            });
        },
        /**
         * Update an searchresult
         */
        update: function(req, res) {
            var searchresult = req.searchresult;

            searchresult = _.extend(searchresult, req.body);

            console.log('Save in progress in searchResult');
            searchresult.save(function(err) {
              if (err) {
                return res.json(500, {
                  error: 'Cannot update the searchresult'
                });
              }
              
              SearchResult.events.publish('update', {
                    description: req.user.name + ' updated ' + req.body.title + ' searchresult.'
                });
              console.log('Save Finished');
              res.json(searchresult);

            });
        },
        /**
         * Delete an searchresult
         */
        destroy: function(req, res) {
            var searchresult = req.searchresult;

            searchresult.remove(function(err) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot delete the searchresult'
                    });
                }

                Articles.events.publish('remove', {
                    description: req.user.name + ' deleted ' + searchresult.title + ' searchresult.'
                });

                res.json(searchresult);
            });
        },
        /**
         * Show an searchresult
         */
        show: function(req, res) {

            SearchResult.events.publish('view', {
                description: req.user.name + ' read ' + req.searchresult.title + ' searchresult.'
            });

            res.json(req.searchresult);
        },
        /**
         * List of searchresult
         */
        all: function(req, res) {
            var query = req.acl.query('SearchResult');

            query.find({}).sort('-created').populate('user', 'name username').exec(function(err, searchresults) {
                if (err) {
                    return res.status(500).json({
                        error: 'Cannot list the articles'
                    });
                }

                res.json(searchresults)
            });
          }
        }
};




