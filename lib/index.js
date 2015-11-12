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
      throw 'type must be string or object';
    }
  },

  /* transform a list of actions into useful functions */
  createActions: function createActions() {
    for (var _len = arguments.length, actions = Array(_len), _key = 0; _key < _len; _key++) {
      actions[_key] = arguments[_key];
    }

    return actions.reduce(function (a, b) {
      a[b] = b;
      return a;
    }, {});
  },

  /* create a named store with an initialState and a reducer to move it forward */
  createStore: function createStore(name, initialState, reducer) {
    var waitFor = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

    var currentState = initialState;
    var emitter = new _fbemitter.EventEmitter();
    var subscription;

    var dispatchToken = dispatcher.register(function (action) {
      dispatcher.waitFor(waitFor);
      var newState = reducer(currentState, action);
      if (currentState !== newState) {
        currentState = newState;
        emitter.emit(changedEvent);
      }
    });

    return Object.freeze({
      name: name,
      dispatchToken: dispatchToken,
      addListener: function addListener(cb) {
        return emitter.addListener(changedEvent, cb);
      },
      getState: function getState(cb) {
        return currentState;
      }
    });
  }

});
module.exports = exports['default'];
