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

  /* transform a list of actions into key-mirrored object */
  createActions: function(...actions) {
    return Object.freeze(actions.reduce(function(a,b) {
      a[b] = b;
      return a;
    }, {}));
  },

  /* create a named store with an initialState and a reducer to move it forward */
  createStore: function(name, initialState, reducer, methods={}) {
    var currentState = Object.freeze(initialState);
    var emitter = new EventEmitter();

    return Object.freeze(Object.assign({
      name: name,
      dispatchToken: dispatcher.register( function(action) {
        var newState = reducer(currentState, action, dispatcher.waitFor);
        if (currentState !== newState) {
          currentState = Object.freeze(newState);
          emitter.emit(changedEvent);
        }
      } ),
      addListener: function(cb) {
        return emitter.addListener(changedEvent, cb)
      },
      getState: function(cb) {
        return currentState;
      }
    }, Object.keys(methods).reduce(function(a, b, i) {
      var newFunc = {};
      newFunc[b] = function(...params) {
        return methods[b](currentState, ...params);
      }
      return Object.assign({}, a, newFunc)
    }, {})));
  }
});
