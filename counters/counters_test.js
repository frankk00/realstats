(function() {
  var assert, assertCallbackOk, counters, i, r, redis, sub, util, vows;
  vows = require('vows');
  util = require("util");
  assert = require('assert');
  redis = require("redis");
  counters = require("./counters.js");
  r = redis.createClient();
  sub = redis.createClient();
  i = 0;
  assertCallbackOk = function(data, err) {
    if (err) {
      console.log(util.inspect(err));
    }
    assert.equal(data.global_key, "counter:www.dahernantest.net");
    assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/");
    assert.isTrue(data.count >= 1);
    return console.log("Counter: " + data.count);
  };
  vows.describe("Counters Test").addBatch({
    'Testing counters': {
      topic: function() {
        return new counters.Counter(r, "testcounter_live", "www.dahernantest.net");
      },
      'is an object': function(counter) {
        return assert.instanceOf(counter, counters.Counter);
      },
      'it can be reset to 0': {
        topic: function(counter) {
          counter.clear(this.callback);
        },
        'increment a counter': {
          topic: function(err, counter) {
            if (err) {
              console.log(util.inspect(err));
            }
            counter.on("counter_incr", this.callback);
            counter.incr(1);
          },
          'should emit the event counter_incr': function(data, err) {
            if (err) {
              console.log(util.inspect(err));
            }
            assert.isTrue(data.count >= 1);
            assert.equal(data.global_key, "counter:www.dahernantest.net");
            return assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/");
          }
        },
        'get a counter value': {
          topic: function(err, counter) {
            counter.on("counter_change", this.callback);
            counter.count();
          },
          'should emit the counter value after count': assertCallbackOk
        },
        'suscribe to a counter and publish increment': {
          topic: function(err, counter) {
            counter.on("counter_change", this.callback);
            counter.subscribe(sub);
            counter.pincr();
          },
          'should emit the counter value after pincr': assertCallbackOk
        },
        'set the value of a counter': {
          topic: function(err, counter) {
            counter.on("counter_change", this.callback);
            counter.set(5);
          },
          'should emit the counter value after set': assertCallbackOk
        },
        'set the value of a counter and publish': {
          topic: function(err, counter) {
            counter.on("counter_change", this.callback);
            counter.pset(30);
          },
          'should emit the counter value after pset': assertCallbackOk
        }
      }
    }
  }).run();
}).call(this);
