'use strict';


var listedecourses = require('../controllers/listedecourses');

// ListDeCourse authorization helpers
/*var hasAuthorization = function(req, res, next) {
  if (!req.user.isAdmin && req.listedecourse.user.id !== req.user.id) {
    return res.send(401, 'User is not authorized');
  }
  next();
};*/

module.exports = function(ListeDeCourse, app, auth) {
  
  app.route('/listedecourses')
    .get(listedecourses.all)
    .post(listedecourses.create);
  app.route('/listedecourses/:listedecourseId')
    .get(listedecourses.show)
    .put( listedecourses.update)
    .delete(listedecourses.destroy);

  // Finish with setting up the listedecourseId param
  app.param('listedecourseId', listedecourses.listedecourse);
  
};