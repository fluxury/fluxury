/* fluxury - Copyright 2015 Peter Moresi */
"use strict";

import {EventEmitter} from 'events';
import Dispatcher from './Dispatcher';

let count = 0;

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
waitFor = dispatcher.waitFor.bind(dispatcher);

export function dispatch(type, data) {
  try {

    if (typeof type === 'string') {
      dispatcher.dispatch({ type: type, data: data })
    } else if (typeof type === 'object') {
      dispatcher.dispatch(type)
    } else {
      throw "type must be string or object"
    }

    return Promise.resolve({ type, data })

  } catch(e) {
    return Promise.reject(e)
  }
}

export function createStore(reducerOrConfig, selectors={}) {

  let currentState;
  var emitter = new EventEmitter();
  let actions = {};
  let reduce = undefined;
  let noop = () => {}

  if (typeof reducerOrConfig === 'function') {
    currentState = reducerOrConfig(undefined, {}, noop)
    reduce = reducerOrConfig
  } else if (typeof reducerOrConfig === 'object') {

    currentState = typeof reducerOrConfig.getInitialState === 'function' ?
    reducerOrConfig.getInitialState(undefined, {}, noop) : undefined;

    // construct a reduce method with the object
    reduce = ((state, action) => {
      if (action && typeof action.type === 'string' && reducerOrConfig.hasOwnProperty(action.type)) {
        return reducerOrConfig[action.type](state, action.data, waitFor);
      }
      return state;
    })

    // create helpful action methods
    actions = Object.keys(reducerOrConfig)
    .reduce((a, b) => {
      a[b] = (data) => dispatcher.dispatch({
        type: b,
        data: data
      })
      return a;
    }, {})

  } else {
    throw new Error('first argument must be object or function', reducerOrConfig)
  }

  let boundMethods = Object.keys(selectors).reduce(function(a, b, i) {
    var newFunc = {};
    newFunc[b] = function(...params) {
      return selectors[b](currentState, ...params);
    }
    return Object.assign(a, newFunc)
  }, {})

  return Object.freeze(
    Object.assign(
      {},
      boundMethods,
      actions,
      {
        dispatchToken: dispatcher.register( function(action) {
          var newState = reduce(currentState, action, waitFor);
          if (currentState !== newState) {
            currentState = typeof newState === 'object' ? Object.freeze(newState) : newState;
            emitter.emit('changed');
          }
        }),
        subscribe: function(cb) {
          if (typeof cb !== 'function') {
            throw "Callback must be a function";
          }

          emitter.addListener('changed', cb)

          count += 1

          return () => {
            emitter.removeListener('changed', cb)
          }
        },
        reduce: (state, action) => reduce(state, action, waitFor),
        setState: (state) => { currentState = state },
        dispatch: (...action) => dispatch(...action),
        getState: function(cb) {
          return currentState;
        }
      }
    )
  );
}

// Compose
export function composeStore(...spec) {

  function isMappedObject(...spec) {
    return (spec.length === 1 &&
      typeof spec[0] === 'object' &&
      typeof spec[0].getState === 'undefined')
  }

  function getState(isMapped, ...spec) {

    if (isMappedObject(...spec)) {
      return Object.keys(spec[0]).reduce((acc, key) => {
        acc[key] = spec[0][key].getState()
        return acc;
      }, {})
    }

    return spec.map(n => n.getState())
  }

  function getStores(isMapped, ...spec) {
    if (isMapped) {
        return Object.keys(spec[0]).reduce((acc, key) => acc.concat(spec[0][key]), [])
    } else {
      spec.forEach( store => {
        if (typeof store.getState !== 'function') {
          if (console && console.log) {
            console.log('ERROR: invalid store')
          }
        }
      })
      return spec
    }
  }

  let isMapped = isMappedObject(...spec)
  let defaultState = getState(isMapped, ...spec)
  let stores = getStores(isMapped, ...spec)

  let dispatchTokens = stores.map(n => n.dispatchToken )

  return createStore(
    (state=defaultState, action, waitFor) => {

      waitFor(dispatchTokens)

      let newState = getState(isMapped, ...spec)

      if (isMapped){ // object specified

        if ( Object.keys(spec[0]).reduce(
          (current, key) =>
          (current && state[key] === newState[key]), true
        )) {
          return state;
        }

      } else { // array specified

        // not changed
        if (
          state.length === newState.length &&
          state.every( (n, i) => n === newState[i] )
        ) {
          return state
        }

      }

      return newState

    },
    {
      getState:(state) => getState(isMapped, ...state)
    }
  )
}
