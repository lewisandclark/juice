(function() {
  var Juice, JuiceLocal, JuiceRemote;

  Juice = (function() {
    /*
      Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
    */
    function Juice() {
      this.ready_fired = false;
      this.remote = new JuiceRemote;
      this.remote.get('http://www.lclark.edu/core/libs/persist-js/persist-min.js', function(xhr) {
        eval(xhr.response);
        console.log(xhr);
        Persist.remove('cookie');
        Persist.remove('ie');
        return Persist.remove('flash');
      });
      this.remote.get('http://www.lclark.edu/core/libs/jquery/jquery-1.7.1.min.js', function(xhr) {
        eval(xhr.response);
        console.log(xhr);
        return console.log($);
      });
      if (document.addEventListener != null) {
        document.addEventListener("DOMContentLoaded", this.ready, false);
        window.addEventListener("load", this.ready, false);
      } else if (document.attachEvent != null) {
        document.attachEvent("onreadystatechange", this.ready);
        window.attachEvent("onload", this.ready);
      }
    }

    Juice.prototype.ready = function(e) {
      if (document.juice.ready_fired) return null;
      return document.juice.init();
    };

    Juice.prototype.init = function() {
      return this.ready_fired = true;
    };

    Juice.prototype.assets = function() {
      return document.getElementsByTagName('asset');
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
    /*
      AJAX Class
      https://github.com/visionmedia/superagent (extra factories)
      http://www.quirksmode.org/js/xmlhttp.html (most of this code)
    */
    function JuiceRemote(domain, base_path) {
      if (domain == null) domain = document.location.origin;
      if (base_path == null) base_path = '';
      this.factories = [function(){ return new XMLHttpRequest(); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 6.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 3.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP"); }, function(){ return new ActiveXObject("Msxml3.XMLHTTP"); }, function(){ return new ActiveXObject("Microsoft.XMLHTTP"); }];
    }

    JuiceRemote.prototype.createXHR = function() {
      var factory, xmlhttp, _i, _len, _ref;
      xmlhttp = false;
      _ref = this.factories;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        factory = _ref[_i];
        try {
          xmlhttp = factory();
        } catch (e) {
          continue;
        }
        break;
      }
      return xmlhttp;
    };

    JuiceRemote.prototype.post = function(url, callback, postData) {
      var method, request;
      if (postData == null) postData = null;
      request = this.createXHR();
      if (!(request != null)) return null;
      method = postData != null ? 'POST' : 'GET';
      request.open(method, url, true);
      if (postData != null) {
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      request.onreadystatechange = function() {
        console.log('readystate');
        if (request.readyState !== 4) return null;
        if (request.status !== 200 && request.status !== 304) {
          throw new Error('HTTP error: ' + request.status);
        }
        return callback(request);
      };
      if (request.readyState === 4) return null;
      return request.send(postData);
    };

    JuiceRemote.prototype.get = function(url, callback) {
      return this.post(url, callback);
    };

    return JuiceRemote;

  })();

  document.juice = new Juice;

  /*
  console.log(document.getElementsByTagName('asset'));
  console.log(document.getElementsByName('manifest')[0].hasChildNodes());
  console.log(document.getElementsByName('manifest')[0].childNodes());
  */

  /*
  require
  
  persistJS (persist-min.js, extras/gears_init.js)
  JSON (should be built in)
  some form of document.ready, use jquery’s?: https://github.com/jquery/jquery/blob/master/src/core.js
  console.log?
  ajax
  
  
  process
  
  loads local manifest
  checks against remote manifest
  requests added/updated scripts ( returned in aggregated file ); simultaneously begins loading available scripts, as determined by load order
  splits, stores added/updated scripts; updates manifest as store is successful
  */

}).call(this);
