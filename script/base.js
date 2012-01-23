// Push all the elements of one array onto the end of another (like concal but
// modifies the array in-place).
if (!Array.prototype.pushAll) {
    Array.prototype.pushAll = function(otherArray) {
        for (var ctr = 0; ctr < otherArray.length; ++ctr) {
            this.push(otherArray[ctr]);
        }
    }
}

// Remove the first instance of the given item from an array
if (!Array.prototype.removeItem) {
    Array.prototype.removeItem = function(item) {
        var l = this.length;
        for (var ctr = 0; ctr < l; ++ctr) {
            if (this[ctr] === item) {
                this.splice(ctr, 1);
            }
        }
    }
}


// Create the 'J' namespace
var J = J || {};
if (typeof(J) !== 'object') {
  J = {};
}


// Simple mixin function - add the properties of 'mixin' to the object
// 'receiver'
J.Mix = function(receiver, mixin) {
  for (var k in mixin) {
    // Don't copy the whole prototype chain...
    if (mixin.hasOwnProperty(k)) {
      receiver[k] = mixin[k];
    }
  }
};
