Baucis Change Log
=================

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