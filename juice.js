(function() {
  var Juice, JuiceLocal, JuiceRemote;

  Juice = (function() {
    /*
      Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
    */
    function Juice() {
      var obj;
      this.ready_fired = false;
      this.url = this.self_dirname();
      this.assets = document.getElementsByTagName('asset');
      this.remote = new JuiceRemote(this);
      obj = this;
      this.remote.get('http://www.lclark.edu/core/libs/juice/third-party/persist-js/persist-all-min.js', function(xhr) {
        if (xhr.status === 200) {
          eval(xhr.response);
          obj.local = new JuiceLocal(obj);
          return obj.load();
          /* yes this works
          if obj.local?
            jquery = obj.local.get('jquery-1.7.1.min.js')
            if jquery?
              eval jquery
              return null
          else
            obj.remote.get 'http://www.lclark.edu/core/libs/jquery/jquery-1.7.1.min.js', (xhr) ->
              if xhr.status is 200
                eval xhr.response
                console.log 'run from load'
                console.log $('asset').length
                obj.local.set('jquery-1.7.1.min.js', xhr.response) if obj.local
              else
                console.log xhr
          */
        } else {
          return console.log(xhr);
        }
      });
      if (document.addEventListener != null) {
        document.addEventListener("DOMContentLoaded", this.run_ready_once, false);
        window.addEventListener("load", this.run_ready_once, false);
      } else if (document.attachEvent != null) {
        document.attachEvent("onreadystatechange", this.run_ready_once);
        window.attachEvent("onload", this.run_ready_once);
      }
    }

    Juice.prototype.self_dirname = function() {
      var script, scripts, _i, _len;
      scripts = document.getElementsByTagName('script');
      for (_i = 0, _len = scripts.length; _i < _len; _i++) {
        script = scripts[_i];
        if ((script.src != null) && script.src.match(/\/juice\.js/)) {
          return script.src.replace(/\/juice\.js(\?.*)?$/, '');
        }
      }
      return null;
    };

    Juice.prototype.run_ready_once = function(e) {
      if (document.juice.ready_fired) return null;
      document.juice.ready_fired = true;
      return document.juice.ready();
    };

    Juice.prototype.ready = function() {
      return console.log('init');
    };

    Juice.prototype.load = function() {
      console.log(this.assets);
      return console.log('load');
    };

    return Juice;

  })();

  JuiceLocal = (function() {

    function JuiceLocal(parent, domain, expires) {
      if (domain == null) domain = document.location.origin;
      if (expires == null) expires = 730;
      if (!(typeof Persist !== "undefined" && Persist !== null)) return null;
      this.Juice = parent;
      Persist.remove('cookie');
      Persist.remove('ie');
      this.store = new Persist.Store('JuiceStore', {
        swf_path: "" + parent.url + "/persist.swf"
      });
      console.log(Persist.type);
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
    function JuiceRemote(parent, domain, base_path) {
      if (domain == null) domain = document.location.origin;
      if (base_path == null) base_path = '';
      this.Juice = parent;
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
