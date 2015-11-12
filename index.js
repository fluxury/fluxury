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
    return actions.reduce(function(a,b) {
      a[b] = b;
      return a;
    }, {});
  },

  /* create a named store with an initialState and a reducer to move it forward */
  createStore: function(name, initialState, reducer, waitFor=[]) {
    var currentState = initialState;
    var emitter = new EventEmitter();
    var subscription;

    var dispatchToken = dispatcher.register( function(action) {
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
      addListener: function(cb) {
        return emitter.addListener(changedEvent, cb)
      },
      getState: function(cb) {
        return currentState;
      }
    });

  }

});
