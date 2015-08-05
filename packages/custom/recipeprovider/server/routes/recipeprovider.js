'use strict';

var recipeProvider = require('../controllers/recipe-provider');

// The Package is past automatically as first parameter
module.exports = function(RecipeProvider, app, auth, database) {

  app.get('/recipeprovider/example/anyone', function(req, res, next) {
    res.send('Anyone can access this');
  });

  app.route('/recipeprovider/search/:q')
  .get(recipeProvider.search);


  app.route('/recipeprovider/recette/:providerName/:url')
  .get(recipeProvider.getRecette);

  app.get('/recipeprovider/example/auth', auth.requiresLogin, function(req, res, next) {
    res.send('Only authenticated users can access this');
  });

  app.get('/recipeprovider/example/admin', auth.requiresAdmin, function(req, res, next) {
    res.send('Only users with Admin role can access this');
  });

  app.get('/recipeprovider/example/render', function(req, res, next) {
    RecipeProvider.render('index', {
      package: 'recipeprovider'
    }, function(err, html) {
      //Rendering a view from the Package server/views
      res.send(html);
    });
  });
};


