Baucis Change Log
=================

v0.9.4
------

Fix an issue where remove middleware wasn't called.  Special thanks to lukaszfiszer!

v0.9.3
------

Set X-Powered-By to baucis for baucis routes

v0.9.2
------

Don't list "sort" query parameter for plural endpoints.

v0.9.1
------
Custom swagger definitions — add an example to the README.

v0.9.0
------

`controller.addSwaggerApi` has been destroyed in favor of exposing the controller Swagger APIs and models at `controller.swagger.apis` and `controller.swagger.models`.  These may be modified directly to change the genereated Swagger definitions.

v0.8.0
------
More Swagger!

Add custom API definitions to a controller with `controller.addSwaggerApi`.  Other minor Swagger fixes.

v0.7.0
------
Add support for hint and comment.  Enable them like so:

    baucis.rest({
      singular: 'fish',
      'allow hints': true,
      'allow comments': true
    });

Note: I decided to be more strict with implementing semver.  Minor version will be increasing with each new feature and patch number will be increased with bug fixes and misc. patches.

v0.6.29
-------
Fix issue #86 which caused request.baucis.controller to sometimes be set incorrectly.

v0.6.28
-------
Fix dependecy on async

v0.6.27
-------
Fix an issue where POST middleware could be called at query stage

v0.6.26
-------
Fix tests for latest version of Mongoose & Express

v0.6.25
-------
Respond with 400 for requests with malformed IDs.  Respond with 405 for disabled verbs.

v0.6.24
-------
Adds default support for form POST (`application/x-www-form-urlencoded`).  Also allows use of default Express request query string parser (`conditions[name]=Tomato`), in addition to the JSON string format that is supported.

v0.6.23
-------
Adds `request.baucis.controller`.  This also fixes issue #76 that was occurring with newer Express versions when they were used as a peer dependency.

v0.6.22
-------
Move Express to peer dependency.

v0.6.21
-------

Fix an issue where the `Location` response header would be set incorrectly.  Special thanks to feychenie.

v0.6.20
-------

Fix an issue with swagger when using models with hyphenated names.  Special
thanks to feychenie.

v0.6.19
-------

Better error handling when detecing selected fields when populating via query.

v0.6.18
-------

Fixes issue #72.  The `Location` header is now only set for POST responses.
This fixes the related issue of response headers being too large when doing
GET requests that return a large number of documents.

v0.6.17
-------

Fixes a bug in v0.6.16 that could allow deselected paths to be sent back in the
response body of a POST request.

v0.6.16
-------

Fixes issue #67

v0.6.15
-------

Allow support for $pull, and $set
  * Deprecates X-Baucis-Push
  * Enables X-Baucis-Update-Operator
  * By default, a mongoose document is updated using `doc.set` then `doc.save`.
  * When the X-Baucis-Update-Operator is set, `findOneAndUpdate` is used
  * *THIS BYPASSES VALIDATION*
  * Operators must be enabled per-controller
  * Supported operators are currently: `$set`, `$pull`, and `$push`.
  * Now positional $ can be used with `$set`!
  * Fields must be whitelisted by setting the appropriate controller option (notice additional $ character)

      var controller = baucis.rest({
        singular: 'arrbitrary',
        'allow $push': 'arr.$.pirates',
        'allow $pull': 'arr.$.pirates'
      });

      // Later...

      // PUT /api/v1/arbitraries/1234567890abcdef12345678?conditions={ "arr.flag": "jolly roger" }

      // X-Baucis-Update-Operator: $push

      // BODY

      //   { "arr.$.pirates": { name: 'Blue beard' } }

      // Blue beard's dead, pull him from the array

      // PUT /api/v1/arbitraries/1234567890abcdef12345678?conditions={ "arr.flag": "jolly roger" }

      // X-Baucis-Update-Operator: $pull

      // BODY

      //   { "arr.$.pirates": { name: 'Blue beard' } }


v0.6.14
-------

Add examples for AngularJS.  Contributed by Illniyar.

v0.6.13
-------

Allow pushing to embedded arrays using positional $
  * Validation is ignored
  * Paths with positional $ must be whitelisted
  * Embedded array must be specified in the conditions query parameter

      var controller = baucis.rest({
        singular: 'arbitrary',
        'allow push': 'arr.$.pirates'
      });

      // Later...

      // PUT /api/v1/arbitraries/1234567890abcdef12345678?conditions={ "arr.flag": "jolly roger" }

      // X-Baucis-Push: true

      // BODY

      //   { "arr.$.pirates": { name: 'Blue beard' } }

v0.6.12
-------

Added X-Baucis-Push header for PUTs
 * Setting this uses $push on the body rather than $set for the update
 * Validation is ignored
 * Feature must be enabled per-controller
 * Fields must be whitelisted by setting the 'allow push' controller option, e.g.

    var controller = baucis.rest({
      singular: 'arbitrary',
      'allow push': 'field some.path some.other.path'
    });
