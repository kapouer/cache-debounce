# debounce-on-demand

"On demand" caching that kicks in only when requests arrive simultaneously.

```javascript
var cacheOnDemand = require('cache-debounce');

// Find all the things related to a URL.
// Let's just say this is a slow operation.

function getTheStuff(url, callback) {
  return myDatabase.find({ url: url }).toArray(callback);
}

// Create a new function with on-demand caching.

var cachedGetTheStuff = cacheOnDemand(getTheStuff, function(url) {
  // A URL makes a great hash key
  return url;
});

// Call cachedGetTheStuff just like we'd call the original.

getTheStuff('/welcome', function(err, stuff) {
  // Hooray, let's loop over the stuff
});

// If only the last request should be served, add a delay to debounce requests
// be warned that it executes only the first queued callback

var cachedGetTheStuff = cacheOnDemand(getTheStuff, function(url) {
  // A URL makes a great hash key
  return url;
}, 500); // delay in milliseconds

getTheStuff('/welcome', function(err, stuff) {
  console.log("called");
});

getTheStuff('/welcome/bernard', function(err, stuff) {
  console.log("not called");
});

getTheStuff('/welcome/bernard', function(err, stuff) {
  console.log("called");
});

var cachedGetTheStuff = cacheOnDemand(getTheStuff, function(url) {
  // A URL makes a great hash key
  return url;
}, {
  timeout: 500,      // delay in milliseconds
  maxTimeout: 5000   // if this parameter is set, subsequent calls reset timeout
  // until there are no more calls or maxTimeout is reached
});

```

Under light load, with calls to `cachedGetTheStuff` taking place separated in time, every request for a given URL will get an individually generated response, which gives them the newest content. Just like calling `getTheStuff` directly.

But under heavy load, with new requests arriving while the first request is still being processed, the additional requests are queued up. When the first response is ready, it is simply sent to all of them. And then the response is discarded, so that the next request to arrive will generate a new response with the latest content.

This gives us "on demand" caching. The server is still allowed to generate new responses often, just not many of them simultaneously. It is the shortest practical lifetime for cache requests and largely eliminates concerns about users seeing old content, as well as concerns about cache memory management. In fact most users will get *fresher content than they would without the caching*, because the server is not overwhelmed and generating responses slowly.

## Writing your hash function

The second argument to `cache-on-demand` is a hash function. It receives the same arguments as your original function, except for the callback.

If this call *should not be cached*, just return `false`.

If this call *should* be cached, return a string for use as a hash key. All calls with the same hash key that arrive while your worker function is running will get the same response, without calling the function again.

## What about errors?

If your main function reports an error to its callback, it is reported to the original caller and all of the pending callers as well. In fact, we simply deliver *all of the same arguments* that your worker function passed to its callback.

