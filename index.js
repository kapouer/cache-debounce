module.exports = cacheDebounce;

function cacheDebounce(fn, hasher, timeout) {
	if (typeof(hasher) != 'function') {
		// Implement 'always'
		var key = hasher;
		hasher = function() {
			return key;
		};
	}
	var maxTimeout = 0;
	if (typeof timeout == "object") {
		maxTimeout = timeout.maxTimeout || 0;
		timeout = timeout.timeout || 0;
	}
	var pending = {};
	return function() {
		// Get something we can slice
		var args = Array.prototype.slice.call(arguments);
		var key = hasher.apply(this, args);
		if (key === false) {
			// hasher says this request can't be cached
			return fn.apply(this, args);
		}
		var callback = args.pop();
		if (typeof callback != 'function') {
			throw new Error("cacheDebounce expects functions to be actors (callback as last argument)");
		}
		if (pending[key]) {
			// A request is in progress, queue up to be sent
			// the same result on completion
			// unless there is debouncing in action
			if (pending[key].timeout) {
				if (maxTimeout && Date.now() - pending[key].now < maxTimeout) {
					clearTimeout(pending[key].timeout);
					pending[key].timeout = setTimeout(pending[key].fun, timeout);
				}
			}
			pending[key].list.push(callback);
			return;
		}
		// start a new pending queue
		pending[key] = {list: [ callback ]};

		function processCb(self, cbArgs) {
			var obj = pending[key];
			// Delete the queue before invoking the callbacks,
			// so we don't risk establishing a chain with no
			// breaks to generate more up-to-date results. The
			// idea is to deliver on demand to everyone who
			// showed up during the generation of this result,
			// and then be open to generating a new result
			delete pending[key];
			// Deliver results to everyone in the queue
			obj.list.forEach(function(cb) {
				// Make sure we're async as the caller expects
				setImmediate(function() {
					cb.apply(self, cbArgs);
				});
			});
		}

		args.push(function() {
			processCb(this, Array.prototype.slice.call(arguments));
		});

		if (timeout) {
			var self = this;
			pending[key].fun = function() {
				delete pending[key].timeout;
				fn.apply(self, args);
			};
			pending[key].now = Date.now();
			pending[key].timeout = setTimeout(pending[key].fun, timeout);
		} else {
			fn.apply(this, args);
		}
	};
}
