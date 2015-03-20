var assert = require("assert");
var cacheOnDemand = require('../index.js');

describe('cacheOnDemand', function(){

  var didTheWork = 0;
  var fn = cacheOnDemand(function(a, b, callback) {
    // Add two numbers, but take 20 ms to do it asynchronously
    setTimeout(function() {
      didTheWork++;
      return callback(a + b);
    }, 20);
  }, function(a, b) {
    // hash them by concatenating them
    return a + ',' + b;
  });

  it('returns functions', function() {
    assert(fn);
  });
  it('delivers result ten times for ten invocations', function(done) {
    var i;
    var received = 0;
    for (i = 0; (i < 10); i++) {
      test();
    }
    function test() {
      return fn(5, 5, function(result) {
        assert(result === 10);
        received++;
        if (received === 10) {
          return done();
        }
      });
    }
  });
  it('does the work only once for those ten invocations', function() {
    assert(didTheWork === 1);
  });
  it('does the work for a second series of invocations', function(done) {
    var i;
    var received = 0;
    for (i = 0; (i < 10); i++) {
      test();
    }
    function test() {
      return fn(6, 6, function(result) {
        assert(result === 12);
        received++;
        if (received === 10) {
          return done();
        }
      });
    }
  });
  it('now a total of two times work has been done', function() {
    assert(didTheWork === 2);
  });
  it('new block of simultaneous requests generates new data, but only once', function(done) {
    var i;
    var received = 0;
    for (i = 0; (i < 10); i++) {
      test();
    }
    function test() {
      return fn(5, 5, function(result) {
        assert(result === 10);
        received++;
        if (received === 10) {
          return done();
        }
      });
    }
  });
  it('now a total of 3 times work has been done', function() {
    assert(didTheWork === 3);
  });
});

