'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;


/**
 * Article Schema
 */
var ListeDeCourseSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  name: {
    type: String,
    trim: true
  },
  recettes: [{
    title: String,
    prepTime: Number,
    cookingTime: Number,
    description:String,
    contenu : {
      nbrPersons: Number,
      ingredients:[{
        quantity: Number,
        product: String,
        unity : String
      }]
    }
  }],
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

/**
 * Validations
 */
ListeDeCourseSchema.path('name').validate(function(name) {
  return !!name;
}, 'Title cannot be blank');

/**
 * Statics
 */
ListeDeCourseSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  }).populate('user', 'name username').exec(cb);
};

mongoose.model('ListeDeCourse', ListeDeCourseSchema);
