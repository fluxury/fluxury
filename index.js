/* fluxury - Copyright 2015 Peter Moresi */
import {EventEmitter} from 'fbemitter';
import {Dispatcher} from 'flux';

/*
Object.assign polyfill copied from MDN
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
*/
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
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

let dispatcher = new Dispatcher(),
changedEvent = 'change',
waitFor = dispatcher.waitFor.bind(dispatcher);

export function dispatch(type, data) {
  if (typeof type === 'string') {
    dispatcher.dispatch({ type: type, data: data })
  } else if (typeof type === 'object') {
    dispatcher.dispatch(type)
  } else {
    throw "type must be string or object"
  }
}

export function createStore(name, initialState, reducer, methods={}) {
  var currentState = Object.freeze(initialState);
  var emitter = new EventEmitter();
  let actions = {};
  let reduce = undefined;

  if (typeof reducer === 'object') {

    // construct a reduce method with the object
    reduce = ((state, action) => {
      if (action && typeof action.type === 'string' && reducer.hasOwnProperty(action.type)) {
        return reducer[action.type](state, action.data, waitFor);
      }
      return state;
    })

    // create helpful action methods
    actions = Object.keys(reducer)
    .reduce((a, b) => {
      a[b] = (data) => dispatcher.dispatch({
        type: b,
        data: data
      })
      return a;
    }, {})

  } else if (typeof reducer === 'function') {
    reduce = reducer
  } else {
    throw new Error('reducer must be object or function')
  }

  let boundMethods = Object.keys(methods).reduce(function(a, b, i) {
    var newFunc = {};
    newFunc[b] = function(...params) {
      return methods[b](currentState, ...params);
    }
    return Object.assign(a, newFunc)
  }, {})

  return Object.freeze(
    Object.assign(
      {},
      boundMethods,
      actions,
      {
        name: name,
        dispatchToken: dispatcher.register( function(action) {
          var newState = reduce(currentState, action, waitFor);
          if (currentState !== newState) {
            currentState = Object.freeze(newState);
            emitter.emit(changedEvent);
          }
        }),
        addListener: function(cb) {
          if (typeof cb !== 'function') {
            throw "Callback must be a function";
          }
          return emitter.addListener(changedEvent, cb)
        },
        getState: function(cb) {
          return currentState;
        }
      }
    )
  );
}
