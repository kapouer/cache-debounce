module.exports = cacheDebounce;

function cacheDebounce(fn, hasher, timeout) {
	if (typeof(hasher) !== 'function') {
		// Implement 'always'
		var key = hasher;
		hasher = function() {
			return key;
		};
	}
	var pending = {};
	return function() {
		// Get something we can slice
		var argumentsArray = Array.prototype.slice.call(arguments);
		var args = argumentsArray.slice(0, argumentsArray.length - 1);
		var callback = argumentsArray[argumentsArray.length - 1];
		var key = hasher.apply(this, args);
		if (key === false) {
			// hasher says this request can't be cached
			return fn.apply(this, arguments);
		}
		if (pending[key]) {
			// A request is in progress, queue up to be sent
			// the same result on completion
			// unless there is debouncing in action
			if (!timeout) pending[key].list.push(callback);
			return;
		}
		// start a new pending queue
		pending[key] = {list: [ callback ]};

		function processCb(self, key, argumentsArray) {
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
					cb.apply(self, argumentsArray);
				});
			});
		}

		args.push(function() {
			var obj = pending[key];
			var argumentsArray = Array.prototype.slice.call(arguments);
			var self = this;
			if (timeout) {
				if (!obj.timeout) {
					obj.timeout = setTimeout(function() {
						processCb(self, key, argumentsArray);
					}, timeout);
				} // else just debounce this callback
			}
			else processCb(self, key, argumentsArray);
		});

		return fn.apply(this, args);
	};
}
