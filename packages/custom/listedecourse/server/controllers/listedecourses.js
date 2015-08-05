'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  ListeDeCourse = mongoose.model('ListeDeCourse'),
  _ = require('lodash');


/**
 * Find article by id
 */
exports.listedecourse = function(req, res, next, id) {
  ListeDeCourse.load(id, function(err, listedecourse) {
    if (err) return next(err);
    if (!listedecourse) return next(new Error('Failed to load listedecourse ' + id));
    req.listedecourse = listedecourse;
    next();
  });
};

/**
 * Create an listedecourse
 */
exports.create = function(req, res) {
  var listedecourse = new ListeDeCourse(req.body);
  listedecourse.user = req.user;
  console.log('Creation start : ' + listedecourse);
  listedecourse.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot save the listedecourse' + err
      });
    }
    res.json(listedecourse);
    console.log('Creation Finish');
  });
};

/**
 * Update an listedecourse
 */
exports.update = function(req, res) {
  var listedecourse = req.listedecourse;

  listedecourse = _.extend(listedecourse, req.body);

  listedecourse.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot update the listedecourse'
      });
    }
    res.json(listedecourse);

  });
};

/**
 * Delete an listedecourse
 */
exports.destroy = function(req, res) {
  var listedecourse = req.listedecourse;

  listedecourse.remove(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot delete the listedecourse'
      });
    }
    res.json(listedecourse);

  });
};

/**
 * Show an listedecourse
 */
exports.show = function(req, res) {
  res.json(req.listedecourse);
};

/**
 * List of listedecourse
 */
exports.all = function(req, res) {
  ListeDeCourse.find().sort('-created').populate('user', 'name username').exec(function(err, listedecourse) {
    if (err) {
      return res.json(500, {
        error: 'Cannot list the listedecourse'
      });
    }
    res.json(listedecourse);

  });
};
