
/*
	Falcon.js
	by Rick Allen (stoodder)

	Version 0.0.1
	Full source at https://github.com/stoodder/falconjs
	Copyright (c) 2011 RokkinCat, http://www.rokkincat.com

	MIT License, https://github.com/stoodder/falconjs/blob/master/LICENSE.md
	This file is generated by `cake build`, do not edit it by hand.
*/

(function() {
  var Humingbird, endsWith, isBoolean, isFunction, isNumber, isObject, _complete_, _current_versions_, _endpoint_, _expire, _failure_, _get, _halt_, _head_, _load, _load_script, _load_style, _load_template, _loaded_, _loading_, _make_options, _queue_, _requested_, _retrieve, _size_, _start_, _storage_, _store, _success_, _versions_, _xhr;

  isObject = function(object) {
    return Object.prototype.toString.call(object) === "[object Object]";
  };

  isFunction = function(object) {
    return Object.prototype.toString.call(object) === "[object Function]";
  };

  isNumber = function(object) {
    return Object.prototype.toString.call(object) === "[object Number]";
  };

  isBoolean = function(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  };

  endsWith = function(haystack, needle) {
    return haystack.indexOf(needle, haystack.length - needle.length) !== -1;
  };

  /*
  #
  */

  _xhr = function() {
    try {
      return (_xhr = function() {
        return new XMLHttpRequest();
      })();
    } catch (e) {
      try {
        return (_xhr = function() {
          return new ActiveXObject('Msxml2.XMLHTTP');
        })();
      } catch (e) {
        return (_xhr = function() {
          return new ActiveXObject('Microsoft.XMLHTTP');
        })();
      }
    }
  };

  /*
  #
  */

  _get = function(url, options) {
    var x;
    if (isFunction(options)) {
      options = {
        'success': options
      };
    }
    if (!isObject(options)) options = {};
    if (!isFunction(options['success'])) options['success'] = (function() {});
    if (!isFunction(options['error'])) options['error'] = (function() {});
    if (!isFunction(options['complete'])) options['complete'] = (function() {});
    x = _xhr();
    x.open('GET', url, true);
    x.onreadystatechange = function() {
      var response, status;
      if (x.readyState === 4) {
        status = x.status;
        response = x.responseText;
        if (status >= 200 && status < 400) {
          options['success'](response, status, x);
        } else {
          options['error'](response, status, x);
        }
        return options['complete'](response, status, x);
      }
    };
    return x.send();
  };

  if ('localStorage' in window && (window['localStorage'] != null)) {
    _retrieve = function(key) {
      return window['localStorage']["!!!HB!!!" + key];
    };
    _store = function(key, value) {
      return window['localStorage']["!!!HB!!!" + key] = value;
    };
    _expire = function() {
      var filename, key, value, _ref, _results;
      _ref = window['localStorage'];
      _results = [];
      for (key in _ref) {
        value = _ref[key];
        if (key.slice(0, 8) === "!!!HB!!!") {
          filename = key.slice(8);
          if (!(filename in _versions_ || filename === "versions")) {
            _results.push(delete window['localStorage'][key]);
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
  } else {
    _storage_ = {};
    _retrieve = function(key) {
      return _storage_[key];
    };
    _store = function(key, value) {
      return _storage_[key] = value;
    };
    _expire = (function() {});
  }

  /*
  #
  */

  _load = function() {
    var attempts, current_version, error, loader, required, src, success, version, _loading_, _next, _obj, _ref, _retry;
    if (typeof _versions_ === "undefined" || _versions_ === null) return;
    if (_loading_) return;
    if (_queue_.length <= 0) {
      _expire();
      _store("versions", JSON.stringify(_current_versions_));
      _complete_(_size_, _loaded_);
      return;
    }
    _obj = _queue_.shift();
    src = _obj['src'];
    _ref = _obj['options'], attempts = _ref.attempts, required = _ref.required, success = _ref.success, error = _ref.error;
    loader = _obj['loader'];
    current_version = _current_versions_[src];
    version = _versions_[src];
    _next = function(code) {
      var _continue, _loading_;
      loader(code, src);
      _loaded_++;
      _loading_ = false;
      _continue = function() {
        if (success.length === 4) {
          return success(src, _size_, _loaded_, _load);
        } else {
          success(src, _size_, _loaded_);
          return _load();
        }
      };
      if (_success_.length === 4) {
        return _success_(src, _size_, _loaded_, _continue);
      } else {
        _success_(src, _size_, _loaded_);
        return _continue();
      }
    };
    _retry = function() {
      _obj['options']['attempts']--;
      _queue_.unshift(_obj);
      return _load();
    };
    if ((version != null) && version === current_version) {
      _next(_retrieve(src));
    } else {
      _loading_ = true;
      _get("" + _endpoint_ + "/" + src, {
        success: function(code, status) {
          _store(src, code);
          _current_versions_[src] = version;
          return _next(code);
        },
        error: function(code, status) {
          if (attempts > 1) {
            return _retry();
          } else {
            if (_failure_.length === 4) {
              return _failure_(src, _size_, _loaded_, (required ? _halt_ : _load));
            } else {
              _failure_(src, _size_, _loaded_);
              if (required) {
                return _halt_();
              } else {
                return _load();
              }
            }
          }
        }
      });
    }
  };

  _load_script = function(code, src) {
    var elm;
    elm = document.createElement('script');
    elm.innerHTML = code;
    elm.type = "text/javascript";
    elm.language = "javascript";
    return _head_.appendChild(elm);
  };

  _load_style = function(code, src) {
    var elm;
    elm = document.createElement('style');
    elm.innerHTML = code;
    elm.type = "text/css";
    return _head_.appendChild(elm);
  };

  _load_template = function(code, src) {
    var url;
    if (typeof Falcon === "undefined" || Falcon === null) return;
    url = Falcon.View.prototype.makeUrl.call({
      'url': src
    });
    return Falcon.View.cacheTemplate(url, code);
  };

  _make_options = function(options) {
    if (isFunction(options)) {
      options = {
        'success': options,
        'attempts': 1
      };
    }
    if (!isObject(options)) options = {};
    if (!isNumber(options.attempts)) options.attempts = 0;
    if (!isBoolean(options.required)) options.required = true;
    if (!isFunction(options.success)) options.success = (function() {});
    if (!isFunction(options.error)) options.error = (function() {});
    options.attempts = parseInt(options.attempts < 0 ? 0 : options.attempts);
    return options;
  };

  _head_ = document.getElementsByTagName('head')[0];

  _endpoint_ = null;

  _queue_ = [];

  _requested_ = {};

  _current_versions_ = null;

  _versions_ = null;

  _loading_ = false;

  _size_ = 0;

  _loaded_ = 0;

  _start_ = (function() {});

  _success_ = (function() {});

  _complete_ = (function() {});

  _failure_ = (function() {});

  _halt_ = (function() {});

  Humingbird = function(endpoint) {
    var _ref, _start_load;
    _endpoint_ = endpoint != null ? endpoint : "";
    _current_versions_ = JSON.parse((_ref = _retrieve("versions")) != null ? _ref : "{}");
    _start_load = function() {
      if (_start_.length === 2) {
        return _start_(_size_, _load);
      } else {
        _start_(_size_);
        return _load();
      }
    };
    _get("" + _endpoint_ + "/versions", {
      success: function(versions) {
        _versions_ = JSON.parse(versions);
        return _start_load();
      },
      error: function() {
        _versions_ = _current_versions_;
        return _start_load();
      }
    });
    return Humingbird;
  };

  Humingbird.script = function(src, options) {
    _size_++;
    _queue_.push({
      'loader': _load_script,
      'src': src,
      'options': _make_options(options)
    });
    return Humingbird;
  };

  Humingbird.style = function(src, options) {
    _size_++;
    _queue_.push({
      'loader': _load_style,
      'src': src,
      'options': _make_options(options)
    });
    return Humingbird;
  };

  Humingbird.template = function(src, options) {
    _size_++;
    _queue_.push({
      'loader': _load_template,
      'src': src,
      'options': _make_options(options)
    });
    return Humingbird;
  };

  Humingbird.start = function(callback) {
    if (!isFunction(callback)) callback = (function() {});
    _start_ = callback;
    return Humingbird;
  };

  Humingbird.complete = function(callback) {
    if (!isFunction(callback)) callback = (function() {});
    _complete_ = callback;
    return Humingbird;
  };

  Humingbird.success = function(callback) {
    if (!isFunction(callback)) callback = (function() {});
    _success_ = callback;
    return Humingbird;
  };

  Humingbird.failure = function(callback) {
    if (!isFunction(callback)) callback = (function() {});
    _failure_ = callback;
    return Humingbird;
  };

  Humingbird.halt = function(callback) {
    if (!isFunction(callback)) callback = (function() {});
    _halt_ = callback;
    return Humingbird;
  };

  window.Humingbird = Humingbird;

}).call(this);
