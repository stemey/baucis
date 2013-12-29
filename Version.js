function getMatchingReleases (releases, dependency) {
  var matching = releases.filter(function (release) {
    return semver.satisfies(release, dependency);
  });

  return matching;
}

function checkVersionConflict (releases, controller) {
  var controllerDependency = controller.get('dependency');

  var matchingReleases = getMatchingReleases(releases, controllerDependency);
  if (matchingReleases.length === 0) throw new Error("The controller dependency \"" + controllerDependency + "\" doesn't satisfy any API release.");

  // Find overlapping ranges.  A range overlaps if it shares any API release
  // versions with another range.
  var overlapping = Object.keys(controllersFor).filter(function (dependency) {
    var otherMatching = getMatchingReleases(releases, dependency);
    return matchingReleases.some(function (release) {
      return otherMatching.indexOf(release) !== -1;
    });
  });
  // Check that the controller does not already exist in any matching ranges.
  var ok = overlapping.every(function (dependency) {
    return controllersFor[dependency].every(function (otherController) {
      if (controller === otherController) return true;
      if (controller.get('plural') === otherController.get('plural')) throw new Error('Controller "' + controller.get('plural') + '" exists more than once in a release.');
      return controller.get('plural') !== otherController.get('plural');
    });
  });

  return !ok;
}

function register (controller) {
  // The controller's semver range
  var dependency = controller.get('dependency');
  if (!semver.validRange(dependency)) throw new Error('Controller dependency was not a valid semver range.');
  // Create an array for this range if it hasn't been registered yet.
  if (!controllersFor[dependency]) controllersFor[dependency] = [];
  // Add the controller to the controllers to be published.
  controllersFor[dependency].push(controller);
  return controller;
}

// __Module Definition__

var version = express();
    var controllersInRelease = [];

    // Find all controllers in this release version.
    Object.keys(controllersFor).forEach(function (dependency) {
      if (!semver.satisfies(release, dependency)) return;
      controllersInRelease = controllersInRelease.concat(controllersFor[dependency]);
    });

    if (controllersInRelease.length === 0) throw new Error('There are no controllers in release "' + release + '".');

    // TODO move these middleware to mixins?

    // Activate Swagger resource listing.
    version.get('/api-docs', function (request, response, next) {
      if (app.get('swagger') !== true) return next();

      response.set('X-Powered-By', 'Baucis');
      response.json(generateResourceListing({
        version: release,
        controllers: controllersInRelease,
        basePath: getBase(request, 1)
      }));
    });

    // Mount all published controllers for this version.
    controllersInRelease.forEach(function (controller) {
      var route = url.resolve('/', controller.get('plural'));

      // Add a route for the controller's Swagger API definition
      version.get('/api-docs' + route, function (request, response, next) {
        if (app.get('swagger') !== true) return next();

        response.set('X-Powered-By', 'Baucis');
        response.json({
          apiVersion: release,
          swaggerVersion: '1.1',
          basePath: getBase(request, 2),
          resourcePath: route,
          apis: controller.swagger.apis,
          models: controller.swagger.models
        });
      });

      // Initialize and mount the controller to the version controller.
      controller.initialize();
      version.use(route, controller);
    });

    app.use(function (request, response, next) {
      // Check the request's version dependency.
      var range = request.headers['api-version'] || '*';
      // Check if this controller satisfies the dependency
      var satisfied = semver.satisfies(release, range);
      // Short-circuit this release if the version doesn't satisfy the dependency.
      if (!satisfied) return next();
      // Otherwise, let the request fall through to this version's middleware.
      response.set('API-Version', release);
      response.set('Vary', 'API-Version')
      return version(request, response, next);
    });
