/* fluxury - Copyright 2015 Peter Moresi */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.createStore = createStore;
var EventEmitter = require('events').EventEmitter;
var Dispatcher = require('./Dispatcher');

var count = 0;

/*
Object.assign polyfill copied from MDN
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
*/
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function value(target) {
      'use strict';

      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(nextSource);
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

// This is a sham that makes Object.freeze work (insecurely) in ES3 environments
// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
  Object.freeze = function freeze(object) {
    if (Object(object) !== object) {
      throw new TypeError('Object.freeze can only be called on Objects.');
    }
    // this is misleading and breaks feature-detection, but
    // allows "securable" code to "gracefully" degrade to working
    // but insecure code.
    return object;
  };
}

var dispatcher = new Dispatcher(),
    waitFor = dispatcher.waitFor.bind(dispatcher);

function _dispatch(type, data) {
  if (typeof type === 'string') {
    dispatcher.dispatch({ type: type, data: data });
  } else if ((typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'object') {
    dispatcher.dispatch(type);
  } else {
    throw "type must be string or object";
  }
}

exports.dispatch = _dispatch;
function createStore(name, initialState, reducer) {
  var methods = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  var currentState = typeof initialState !== 'function' ? (typeof initialState === 'undefined' ? 'undefined' : _typeof(initialState)) === 'object' ? Object.freeze(initialState) : initialState : Object.freeze({});

  var emitter = new EventEmitter();
  var actions = {};
  var reduce = undefined;

  if (typeof initialState === 'function') {
    methods = reducer;
    reducer = initialState;
  }

  if ((typeof reducer === 'undefined' ? 'undefined' : _typeof(reducer)) === 'object') {

    // construct a reduce method with the object
    reduce = function reduce(state, action) {
      if (action && typeof action.type === 'string' && reducer.hasOwnProperty(action.type)) {
        return reducer[action.type](state, action.data, waitFor);
      }
      return state;
    };

    // create helpful action methods
    actions = Object.keys(reducer).reduce(function (a, b) {
      a[b] = function (data) {
        return dispatcher.dispatch({
          type: b,
          data: data
        });
      };
      return a;
    }, {});
  } else if (typeof reducer === 'function') {
    reduce = reducer;
  } else {
    throw new Error('reducer must be object or function');
  }

  var boundMethods = Object.keys(methods).reduce(function (a, b, i) {
    var newFunc = {};
    newFunc[b] = function () {
      var _methods;

      for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
        params[_key] = arguments[_key];
      }

      return (_methods = methods)[b].apply(_methods, [currentState].concat(params));
    };
    return Object.assign(a, newFunc);
  }, {});

  return Object.freeze(Object.assign({}, boundMethods, actions, {
    name: name,
    dispatchToken: dispatcher.register(function (action) {
      var newState = reduce(currentState, action, waitFor);
      if (currentState !== newState) {
        currentState = (typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) === 'object' ? Object.freeze(newState) : newState;
        emitter.emit('changed');
      }
    }),
    subscribe: function subscribe(cb) {
      if (typeof cb !== 'function') {
        throw "Callback must be a function";
      }

      emitter.addListener('changed', cb);

      count += 1;

      return {
        id: count,
        remove: function remove() {
          emitter.removeListener('changed', cb);
        }
      };
    },
    replaceState: process.env.NODE_ENV === 'development' ? function (state) {
      currentState = state;
    } : undefined,
    replaceReducer: process.env.NODE_ENV === 'development' ? function (reducer) {
      reduce = reducer;
    } : undefined,
    dispatch: function dispatch() {
      for (var _len2 = arguments.length, action = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        action[_key2] = arguments[_key2];
      }

      return _dispatch(action);
    },
    getState: function getState(cb) {
      return currentState;
    }
  }));
}
