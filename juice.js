(function() {
  var Juice, JuiceAsset, JuiceBase, JuiceLocal, JuiceRemote,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  JuiceBase = (function() {

    function JuiceBase() {}

    /*
      usage: log('inside coolFunc',this,arguments);
      http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
    */

    JuiceBase.prototype.log = function(message, caller) {
      if (!(message != null)) return null;
      this.history = this.history || [];
      this.history.push(arguments);
      this.history.push(arguments);
      if ((typeof console !== "undefined" && console !== null) && (console.log != null)) {
        console.log(message);
        if ((caller != null) && (caller.name != null)) console.log(caller.name);
        return console.log(Array.prototype.slice.call(arguments));
      }
    };

    return JuiceBase;

  })();

  Juice = (function(_super) {

    __extends(Juice, _super);

    /*
      Ready code adapted from jQuery: https://github.com/jquery/jquery/blob/master/src/core.js
    */

    function Juice() {
      var obj;
      this.is_ready = false;
      this.url = this.self_dirname();
      this.register_assets();
      this.remote = new JuiceRemote(this);
      obj = this;
      this.remote.get('http://www.lclark.edu/core/libs/juice/third-party/persist-js/persist-all-min.js', function(xhr) {
        if (xhr.status === 200) {
          try {
            eval(xhr.response);
          } catch (e) {
            obj.log(e, arguments);
          }
          return obj.load_when_ready();
        } else {
          return obj.log(xhr, arguments);
        }
      });
      if (document.addEventListener != null) {
        document.addEventListener("DOMContentLoaded", this.ready, false);
        window.addEventListener("load", this.ready, false);
      } else if (document.attachEvent != null) {
        document.attachEvent("onreadystatechange", this.ready);
        window.attachEvent("onload", this.ready);
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

    Juice.prototype.ready = function(e) {
      return document.juice.is_ready = true;
    };

    Juice.prototype.load_when_ready = function() {
      var obj;
      console.log('load');
      if (this.is_ready) {
        return this.local = new JuiceLocal(this);
      } else {
        obj = this;
        return setTimeout(function(){ obj.load(); }, 1);
      }
    };

    Juice.prototype.register_assets = function() {
      var asset, assets, checksum, _i, _len;
      assets = document.getElementsByTagName('asset');
      this.assets = [];
      for (_i = 0, _len = assets.length; _i < _len; _i++) {
        asset = assets[_i];
        checksum = asset.getAttribute('checksum');
        if (checksum != null) this.assets[checksum] = new JuiceAsset(this, asset);
      }
      return this.log(this.assets, arguments);
    };

    return Juice;

  })(JuiceBase);

  JuiceAsset = (function(_super) {

    __extends(JuiceAsset, _super);

    function JuiceAsset(parent, asset) {
      this.Juice = parent;
      this.is_loaded = false;
      this.checksum = asset.checksum;
      if (asset.name != null) this.name = asset.name;
      if (asset.version != null) this.version = asset.version;
      if (asset.dependencies != null) {
        this.dependencies = asset.dependencies.split(',');
      }
      if (asset.src != null) this.sources = asset.src.split('||');
      this.raw = '';
      this.listeners = {};
      console.log(this);
    }

    JuiceAsset.prototype.onSuccess = function(asset) {
      return this.listeners[asset.checksum] = function(){asset.load();};
    };

    JuiceAsset.prototype.load = function() {
      var code;
      if (this.Juice.local != null) {
        code = this.Juice.local.get(this.checksum);
        if (code != null) {
          try {
            eval(code);
          } catch (e) {
            this.error(e);
          }
          return this.success();
        } else {
          this.error("failed to retreive " + this.name + "::" + this.checksum + ", attempting xhr load instead");
        }
      }
      return this.retrieve();
    };

    JuiceAsset.prototype.retrieve = function(index) {
      var obj;
      if (index == null) index = 0;
      obj = this;
      if (!(sources[index] != null)) return this.error("all sources failed");
      return this.Juice.remote.get(this.sources[index], function(xhr) {
        if (xhr.status === 200) {
          try {
            eval(xhr.response);
          } catch (e) {
            obj.error(e);
          }
          if (obj.Juice.local != null) {
            obj.Juice.local.set(obj.checksum, xhr.response);
          }
          return obj.success();
        } else {
          return obj.error(xhr);
        }
      });
    };

    JuiceAsset.prototype.success = function() {
      console.log('success');
      return true;
    };

    JuiceAsset.prototype.error = function(message) {
      if (message == null) message = null;
      return console.log(message != null ? message : "" + this.name + "::" + this.checksum + " load failed");
    };

    return JuiceAsset;

  })(JuiceBase);

  JuiceLocal = (function(_super) {

    __extends(JuiceLocal, _super);

    function JuiceLocal(parent, domain, expires) {
      var options;
      if (domain == null) domain = document.location.origin;
      if (expires == null) expires = 730;
      if (!(typeof Persist !== "undefined" && Persist !== null)) return null;
      this.Juice = parent;
      Persist.remove('cookie');
      Persist.remove('ie');
      options = {
        domain: domain,
        expires: expires
      };
      if (parent.url != null) {
        options['swf_path'] = "" + parent.url + "/third-party/persist-js/persist.swf";
      } else {
        Persist.remove('flash');
      }
      this.store = new Persist.Store('JuiceStore', options);
      console.log(Persist.type);
    }

    JuiceLocal.prototype.get = function(key) {
      try {
        this.store.get(key);
      } catch (e) {
        console.log(e);
      }
      return null;
    };

    JuiceLocal.prototype.set = function(key, value) {
      if (value == null) value = '';
      try {
        if (value.length === 0) {
          this.store.remove(key);
        } else {
          if (Persist.size !== -1 && Persist.size < value.length) {
            throw new Error('too much data');
          }
          this.store.set(key, value);
        }
      } catch (e) {
        console.log(e);
      }
      return null;
    };

    return JuiceLocal;

  })(JuiceBase);

  JuiceRemote = (function(_super) {

    __extends(JuiceRemote, _super);

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

  })(JuiceBase);

  document.juice = new Juice;

}).call(this);
