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
    var queries = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
    var waitFor = arguments.length <= 4 || arguments[4] === undefined ? [] : arguments[4];

    var currentState = Object.freeze(initialState);
    var emitter = new _fbemitter.EventEmitter();

    // The last argument is always waitFor. If queries is an array then it is used for waitFor.
    if (Array.isArray(queries)) {
      waitFor = queries;
      queries = {};
    }

    return Object.freeze({
      name: name,
      dispatchToken: dispatcher.register(function (action) {
        dispatcher.waitFor(waitFor);
        var newState = reducer(currentState, action);
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
      },
      queries: Object.freeze(Object.keys(queries).reduce(function (a, b, i) {
        var newFunc = {};
        newFunc[b] = function (params) {
          return queries[b](currentState, params);
        };
        return Object.assign({}, a, newFunc);
      }, {})),
      waitFor: waitFor
    });
  }

});
module.exports = exports['default'];
