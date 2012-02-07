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

J.SortObject = function(obj) {
  var count = [];
  var result = [];
  
  var l = 0;
  var curr, curr_count;
  var highest_count = 0;
  
  for (k in obj) {
    curr_count = obj[k];
    
    if (curr_count > highest_count)
      highest_count = curr_count;
      
    if (count[curr_count] !== undefined)
      count[curr_count] = count[curr_count] + 1;
    else
      count[curr_count] = 1;
  }
  
  for (var ctr = 0; ctr <= highest_count; ++ctr) {
    if (count[ctr] === undefined)
      count[ctr] = 0;
  }
  
  var total = 0;
  var c;
  for (var ctr = 0; ctr <= highest_count; ++ctr) {
    c = count[ctr];
    count[ctr] = total;
    total = total + c;
  }
  
  var result_idx = 0;
  for (k in obj) {
    curr_count = obj[k];
    result_idx = count[curr_count];
    
    result[result_idx] = k;
    count[curr_count] = count[curr_count] + 1;
  }
  
  return result;
};

J.CountingSort = function(to_sort) {
  var count = [];
  var result = [];
  
  var l = to_sort.length;
  var curr, curr_count;
  var highest_count = 0;
  for (var ctr = 0; ctr < l; ++ctr) {
    curr = to_sort[ctr];
    curr_count = curr.count;

    if (curr_count > highest_count)
      highest_count = curr_count;

    if (count[curr_count] !== undefined)
      count[curr_count] = count[curr_count] + 1;
    else
      count[curr_count] = 1;
  }
    

  for (var ctr = 0; ctr <= highest_count; ++ctr) {
    if (count[ctr] === undefined)
      count[ctr] = 0;
  }


  var total = 0;
  var c;
  for (var ctr = 0; ctr <= highest_count; ++ctr) {
    c = count[ctr];
    count[ctr] = total;
    total = total + c;
  }

  var result_idx = 0;
  for (var ctr = 0; ctr < l; ++ctr) {
    curr = to_sort[ctr];
    curr_count = curr.count;
    result_idx  = count[curr_count];

    result[result_idx] = curr;
    count[curr_count] = count[curr_count] + 1;
  }

  return result;
};