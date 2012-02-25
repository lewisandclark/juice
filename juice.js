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

    JuiceBase.prototype.error = function(message) {
      if (message == null) message = '';
      return console.log(message);
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
      this.origin = document.location.host;
      this.assets = {};
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
      var asset, checksum, obj, _ref, _results;
      console.log('load');
      if (this.is_ready) {
        this.local = new JuiceLocal(this);
        _ref = this.assets;
        _results = [];
        for (checksum in _ref) {
          asset = _ref[checksum];
          if (!(asset.dependencies != null)) {
            _results.push(asset.load());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      } else {
        obj = this;
        return setTimeout(function(){ obj.load(); }, 1);
      }
    };

    Juice.prototype.register_assets = function() {
      var asset, assets, checksum, _i, _len, _ref, _results;
      assets = document.getElementsByTagName('asset');
      for (_i = 0, _len = assets.length; _i < _len; _i++) {
        asset = assets[_i];
        checksum = asset.getAttribute('checksum');
        if (checksum != null) this.assets[checksum] = new JuiceAsset(this, asset);
      }
      _ref = this.assets;
      _results = [];
      for (checksum in _ref) {
        asset = _ref[checksum];
        _results.push(asset.register());
      }
      return _results;
    };

    return Juice;

  })(JuiceBase);

  JuiceAsset = (function(_super) {

    __extends(JuiceAsset, _super);

    function JuiceAsset(parent, asset) {
      var attribute, value, _i, _len, _ref;
      this.Juice = parent;
      this.is_loaded = false;
      _ref = ['checksum', 'name', 'version', 'dependencies', 'src'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attribute = _ref[_i];
        value = asset.getAttribute(attribute);
        if ((value != null) && value !== '') this[attribute] = value;
      }
      if (this.dependencies != null) {
        this.dependencies = this.dependencies.split(',');
      }
      if (this.src != null) this.src = this.src.split('||');
      this.raw = '';
      this.listeners = {};
    }

    JuiceAsset.prototype.is_cross_domain = function(url) {
      var host;
      url = url.split('//');
      if (url.length === 1) return false;
      host = url[1].split('/').shift();
      return host !== this.Juice.origin;
    };

    JuiceAsset.prototype.onSuccess = function(asset) {
      return this.listeners[asset.checksum] = function(){asset.load();};
    };

    JuiceAsset.prototype.load = function() {
      var code;
      console.log("loading " + this.name);
      if (!(this.raw != null)) return null;
      console.log(!(this.raw != null));
      console.log("loading " + this.name);
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
          this.log("failed to retrieve " + this.name + "::" + this.checksum + ", attempting xhr load instead");
        }
      }
      return this.retrieve();
    };

    JuiceAsset.prototype.retrieve = function(index) {
      var obj;
      if (index == null) index = 0;
      obj = this;
      if (!(this.src[index] != null)) return this.error("all sources failed");
      return this.Juice.remote.get(this.src[index], function(xhr) {
        if (xhr.status === 200 || xhr.status === 304) {
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
          if (obj.src.length - 1 > index) {
            return obj.retrieve(index + 1);
          } else {
            return obj.error("unable to retrieve code " + xhr);
          }
        }
      });
    };

    JuiceAsset.prototype.register = function() {
      var dependency, _i, _len, _ref, _results;
      if (!(this.dependencies != null)) return null;
      _ref = this.dependencies;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dependency = _ref[_i];
        if (this.Juice.assets[dependency] != null) {
          _results.push(this.Juice.assets[dependency].onSuccess(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    JuiceAsset.prototype.success = function() {
      var checksum, listener, _ref;
      this.log("retrieved and stored " + this.name + "::" + this.checksum);
      _ref = this.listeners;
      for (checksum in _ref) {
        listener = _ref[checksum];
        listener();
      }
      return true;
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
        this.error(e);
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
        this.error(e);
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

    function JuiceRemote(parent) {
      this.Juice = parent;
      this.factories = [function(){ return new XMLHttpRequest(); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 6.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP 3.0"); }, function(){ return new ActiveXObject("Msxml2.XMLHTTP"); }, function(){ return new ActiveXObject("Msxml3.XMLHTTP"); }, function(){ return new ActiveXObject("Microsoft.XMLHTTP"); }];
    }

    JuiceRemote.prototype.createXHR = function(url) {
      var factory, xhr, _i, _len, _ref;
      xhr = false;
      _ref = this.factories;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        factory = _ref[_i];
        try {
          xhr = factory();
        } catch (e) {
          continue;
        }
        break;
      }
      return xhr;
    };

    JuiceRemote.prototype.post = function(url, callback, postData) {
      var method, obj, request;
      if (postData == null) postData = null;
      request = this.createXHR();
      if (!(request != null)) return null;
      method = postData != null ? 'POST' : 'GET';
      request.open(method, url, true);
      if (postData != null) {
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      obj = this;
      request.onreadystatechange = function() {
        if (request.readyState !== 4) return null;
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
