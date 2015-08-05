'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var RecipeProvider = new Module('recipeprovider');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
RecipeProvider.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  RecipeProvider.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  /*RecipeProvider.menus.add({
    title: 'Recherche de recette',
    link: 'marmiton search',
    roles: ['anonymous'],
    menu: 'main'
  });*/
  

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    RecipeProvider.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    RecipeProvider.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    RecipeProvider.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return RecipeProvider;
});
