if (typeof(J) === 'undefined')
  J = {};

J.Facebook = (function() {
  _initialised = false;
  _started = false;

  // The Facebook session
  _session = null;

  // Initialise the module...
  var _init = function() {
    if (_initialised === true)
      return;

    _initialised = true;
  };


  // 'Start' the module - asynchronously load the Facebook JS library
  // NOTE: Is this really different from _init?
  var _start = function() {
    if (_started === true)
      return; // already started

    // Load the facebook library asynchronously...
    var e = document.createElement('script');
    e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
    e.async = true;
    document.getElementById('fb-root').appendChild(e);
    
    _started = true;
  };



  // Check whether we are currently logged into Facebook.
  // Issue 'j.facebook.loggedin' notification if we are,
  // 'j.facebook.loggedout' notification if we are not.
  var _checkLogin = (function() {
    var __loginStatusResult = function(response) {
      _session = response.authResponse;

      var key = (_session === null) ? 'j.facebook.loggedout' : 'j.facebook.loggedin';
      J.NotificationCenter.Notify(key, J.Facebook, null);
    };

    return function() {
      FB.getLoginStatus(__loginStatusResult);
    };
  }());


  
  // Log in to Facebook...
  var _login = (function() {
    var __loginComplete = function(response) {
      _session = response.authResponse;
      
      var key = (_session === null) ? 'j.facebook.loggedout' : 'j.facebook.loggedin';
      J.NotificationCenter.Notify(key, J.Facebook, null);
    };

    return function() {
      // TODO: User should be able to configure the permissions
      FB.login(__loginComplete, { scope : 'read_stream,publish_stream,offline_access' });
    };
  }());



  // Log out of Facebook
  var _logout = (function() {
    var __logoutComplete = function(response) {
      if (!response || response.error) {
        var msg = "Could not log out"
        if (response && response.error)
          msg = msg + ': '+response.error;
        J.NotificationCenter.Notify('fb.error.message', msg);
      } else {
        J.NotificationCenter.Notify('fb.loggedout', J.Facebook, null);
      }
    };

    return function() {
      FB.logout(__logoutComplete);
    };
  }());


  return {
    Init : _init,
    Start : _start,

    
    CheckLogin : _checkLogin,
    Login : _login,
    Logout : _logout
  };
}());


// The Facebook library calls this when it is loaded...
window.fbAsyncInit = function() {
  FB.init({
    appId: '104738679566253',
		status: true,
		cookie: true,
		xfbml: true
  });

  // Let our object know that the FB API is ready to use
  J.Facebook.Ready();
};