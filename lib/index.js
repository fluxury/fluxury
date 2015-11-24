/* Fluxury - Copyright 2015 Peter W Moresi */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _fbemitter = require('fbemitter');

var _flux = require('flux');

var dispatcher = new _flux.Dispatcher();
var changedEvent = 'change';

exports['default'] = Object.freeze({

  /* thin bridge to internal dispatcher */
  dispatch: function dispatch(type, data) {
    if (typeof type === 'string') {
      dispatcher.dispatch({ type: type, data: data });
    } else if (typeof type === 'object') {
      dispatcher.dispatch(type);
    } else {
      throw "type must be string or object";
    }
  },

  /* transform a list of actions into key-mirrored object */
  createActions: function createActions() {
    for (var _len = arguments.length, actions = Array(_len), _key = 0; _key < _len; _key++) {
      actions[_key] = arguments[_key];
    }

    return Object.freeze(actions.reduce(function (a, b) {
      a[b] = b;
      return a;
    }, {}));
  },

  /* create a named store with an initialState and a reducer to move it forward */
  createStore: function createStore(name, initialState, reducer) {
    var methods = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    var currentState = Object.freeze(initialState);
    var emitter = new _fbemitter.EventEmitter();

    return Object.freeze(Object.assign({
      name: name,
      dispatchToken: dispatcher.register(function (action) {
        var newState = reducer(currentState, action, dispatcher.waitFor);
        if (currentState !== newState) {
          currentState = Object.freeze(newState);
          emitter.emit(changedEvent);
        }
      }),
      addListener: function addListener(cb) {
        return emitter.addListener(changedEvent, cb);
      },
      getState: function getState(cb) {
        return currentState;
      }
    }, Object.keys(methods).reduce(function (a, b, i) {
      var newFunc = {};
      newFunc[b] = function () {
        for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          params[_key2] = arguments[_key2];
        }

        return methods[b].apply(methods, [currentState].concat(params));
      };
      return Object.assign({}, a, newFunc);
    }, {})));
  }
});
module.exports = exports['default'];
