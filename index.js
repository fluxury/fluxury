/* Fluxury - Copyright 2015 Peter W Moresi */
import {EventEmitter} from 'fbemitter';
import {Dispatcher} from 'flux';
var dispatcher = new Dispatcher();
var changedEvent = 'change';

export default Object.freeze({

  /* thin bridge to internal dispatcher */
  dispatch: function(type, data) {
    if (typeof type === 'string') {
      dispatcher.dispatch({ type: type, data: data })
    } else if (typeof type === 'object') {
      dispatcher.dispatch(type)
    } else {
      throw "type must be string or object"
    }
  },

  /* transform a list of actions into useful functions */
  createActions: function(...actions) {
    return Object.freeze(actions.reduce(function(a,b) {
      a[b] = b;
      return a;
    }, {}));
  },

  /* create a named store with an initialState and a reducer to move it forward */
  createStore: function(name, initialState, reducer, queries={}, waitFor=[]) {
    var currentState = Object.freeze(initialState);
    var emitter = new EventEmitter();

    // The last argument is always waitFor. If queries is an array then it is used for waitFor.
    if (Array.isArray(queries)) {
      waitFor = queries;
      queries = {};
    }

    var dispatchToken = dispatcher.register( function(action) {
      dispatcher.waitFor(waitFor);
      var newState = reducer(currentState, action);
      if (currentState !== newState) {
        currentState = Object.freeze(newState);
        emitter.emit(changedEvent);
      }
    });

    return Object.freeze({
      name: name,
      dispatchToken: dispatchToken,
      addListener: function(cb) {
        return emitter.addListener(changedEvent, cb)
      },
      getState: function(cb) {
        return currentState;
      },
      queries: Object.freeze(Object.keys(queries).reduce(function(a, b, i) {
        var newFunc = {};
        newFunc[b] = function() {
          return queries[b](currentState);
        }
        return Object.assign({}, a, newFunc)
      }, {})),
      waitFor: waitFor
    });

  }

});
