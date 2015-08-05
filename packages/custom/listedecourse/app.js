'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Listedecourse = new Module('listedecourse');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Listedecourse.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Listedecourse.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Listedecourse.menus.add({
    title: 'Les meilleures recettes du web dans votre liste de courses',
    link: 'Homepage',
    roles: ['anonymous']
    /*,
    menu: 'main'*/
  });
  
  Listedecourse.aggregateAsset('css', 'listedecourse.css');

  Listedecourse.angularDependencies(['angulartics']);


  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Listedecourse.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Listedecourse.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Listedecourse.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Listedecourse;
});
