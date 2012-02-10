(function() {
  var Juice, JuiceLocal, JuiceRemote;

  $(document).ready(function() {
    return document.juice = new Juice;
  });

  Juice = (function() {

    function Juice() {
      this.local = new JuiceLocal;
      this.remote = new JuiceRemote;
    }

    Juice.prototype.refresh_manifest = function() {};

    Juice.prototype.manifest = function() {
      try {
        return this.store.get('manifest');
      } catch (e) {
        return console.log(e);
      }
    };

    return Juice;

  })();

  JuiceLocal = (function() {

    function JuiceLocal(domain, expires) {
      if (domain == null) domain = document.location.origin;
      if (expires == null) expires = 730;
      Persist.remove('cookie');
      Persist.remove('ie');
      Persist.remove('flash');
      this.store = new Persist.Store('JuiceStore', {
        domain: domain,
        expires: expires
      });
    }

    JuiceLocal.prototype.get = function(key) {
      try {
        return this.store.get(key);
      } catch (e) {
        return console.log(e);
      }
    };

    JuiceLocal.prototype.set = function(key, value) {
      if (value == null) value = '';
      try {
        if (value.length === 0) {
          return this.store.remove(key);
        } else {
          if (Persist.size !== -1 && Persist.size < value.length) {
            throw new Error('too much data');
          }
          return this.store.set(key, value);
        }
      } catch (e) {
        return console.log(e);
      }
    };

    return JuiceLocal;

  })();

  JuiceRemote = (function() {

    JuiceRemote.xmlhttp = false;

    JuiceRemote.factories = [function(){ return new XMLHttpRequest(); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 6.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 3.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP"); }, function(){ return new ActiveXObject("Msxml3.XMLHTTP"); }, function(){ return new ActiveXObject("Microsoft.XMLHTTP"); }];

    function JuiceRemote(domain, base_path) {
      if (domain == null) domain = document.location.origin;
      if (base_path == null) base_path = '';
      null;
    }

    JuiceRemote.prototype.createXHR = function() {
      var factory, _i, _len, _ref, _results;
      _ref = this.factories;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        factory = _ref[_i];
        try {
          this.xmlhttp = factory();
        } catch (e) {
          continue;
        }
        break;
      }
      return _results;
    };

    return JuiceRemote;

  })();

  /*
  
  http://www.quirksmode.org/js/xmlhttp.html
  
  function sendRequest(url,callback,postData) {
  	var req = createXMLHTTPObject();
  	if (!req) return;
  	var method = (postData) ? "POST" : "GET";
  	req.open(method,url,true);
  	req.setRequestHeader('User-Agent','XMLHTTP/1.0');
  	if (postData)
  		req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
  	req.onreadystatechange = function () {
  		if (req.readyState != 4) return;
  		if (req.status != 200 && req.status != 304) {
  //			alert('HTTP error ' + req.status);
  			return;
  		}
  		callback(req);
  	}
  	if (req.readyState == 4) return;
  	req.send(postData);
  }
  
  var XMLHttpFactories = [
  	function () {return new XMLHttpRequest()},
  	function () {return new ActiveXObject("Msxml2.XMLHTTP")},
  	function () {return new ActiveXObject("Msxml3.XMLHTTP")},
  	function () {return new ActiveXObject("Microsoft.XMLHTTP")}
  ];
  
  function createXMLHTTPObject() {
  	var xmlhttp = false;
  	for (var i=0;i<XMLHttpFactories.length;i++) {
  		try {
  			xmlhttp = XMLHttpFactories[i]();
  		}
  		catch (e) {
  			continue;
  		}
  		break;
  	}
  	return xmlhttp;
  }
  */

  /*
  require
  
  persistJS (persist-min.js, extras/gears_init.js)
  JSON (should be built in)
  some form of document.ready, use jquery’s?: https://github.com/jquery/jquery/blob/master/src/core.js
  console.log?
  ajax -- hmmm, this is a challenge
  
  
  process
  
  loads local manifest
  checks against remote manifest
  requests added/updated scripts ( returned in aggregated file ); simultaneously begins loading available scripts, as determined by load order
  splits, stores added/updated scripts; updates manifest as store is successful
  */

}).call(this);
