'use strict';



// The Package is past automatically as first parameter
module.exports = function(RecipeProvider, app, auth, database) {

  var recipeProvider = require('../controllers/recipe-provider');

  app.get('/recipeprovider/example/anyone', function(req, res, next) {
    console.log("get example");
    res.send('Anyone can access this');
  });

  app.route('/api/recipeprovider/search/:q')
  .get(recipeProvider.search);


  app.route('/api/recipeprovider/recette/:providerName/:url')
  .get(recipeProvider.getRecette);

  app.get('/api/recipeprovider/example/auth', auth.requiresLogin, function(req, res, next) {
    res.send('Only authenticated users can access this');
  });

  app.get('/api/recipeprovider/example/admin', auth.requiresAdmin, function(req, res, next) {
    res.send('Only users with Admin role can access this');
  });

  app.get('/api/recipeprovider/example/render', function(req, res, next) {
    RecipeProvider.render('index', {
      package: 'recipeprovider'
    }, function(err, html) {
      //Rendering a view from the Package server/views
      res.send(html);
    });
  });
};


