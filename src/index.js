/* pure-flux - Copyright 2015 Peter Moresi */
"use strict";

import Dispatcher from './Dispatcher';

let rootState = Object.freeze({}),
stores = {},
dispatcher = new Dispatcher(),
waitFor = dispatcher.waitFor.bind(dispatcher);

function copyIfSame(current, next) {
  if (current === next) return current.slice()
  return next
}

function updateRootState(name, newState) {
  var changes = {}
  changes[name] = typeof newState === 'object' ? Object.freeze(newState) : newState
  rootState = Object.assign({}, rootState, changes)
}

function isPromise(object) {
  return typeof object === 'object' && typeof object.then === 'function'
}

export function dispatch(action, data) {
  try {

    if (isPromise(action)) {
      return action
      .then(result => {
        dispatch(result)
        return Promise.resolve(result)
      })
    } else if (typeof action === 'object') {
      dispatcher.dispatch(action)
      return Promise.resolve(action)
    } else if (typeof action === 'string') {
      dispatcher.dispatch({ type: action, data: data })
      return Promise.resolve({ type: action, data: data })
    } else {
      return Promise.reject('Invalid action!')
    }


  } catch(e) {
    return Promise.reject(e)
  }
}

// construct a reducer method with a spec
function makeReducer(spec) {

  return ((state, action) => {

    // Check if action has definition and run it if available.
    if (action && typeof action.type === 'string' && spec.hasOwnProperty(action.type)) {
      return spec[action.type](state, action.data, waitFor);
    }

    // Return current state when action has no handler.
    return state;

  })
}


function bindSelectors(name, selectors) {
  return Object.keys(selectors).reduce(function(a, b, i) {
    var newFunc = {};
    newFunc[b] = function(...params) {
      return selectors[b](rootState[name], ...params);
    }
    return Object.assign(a, newFunc)
  }, {} )
}

export function getStores() {
  return stores
}

export function getStore(name) {
  return stores[name]
}

export function createStore(name, reducer, selectors={}) {

  if (typeof name !== 'string') throw('Expect name to be string.')
  if (typeof reducer !== 'function') throw('Expect reducer to be function.')
  if (typeof selectors !== 'object') throw('Expect selectors to be object.')

  let currentListeners = [],
  nextListeners = [];

  updateRootState(
    name,
    reducer(undefined, {}, () => {})
  )

  var dispatchToken = dispatcher.register( function(action) {
    var newState = reducer(rootState[name], action, waitFor);
    if (rootState[name] !== newState) {

      updateRootState(
        name,
        newState
      )

      // avoid looping over potentially mutating list
      var listeners = currentListeners = nextListeners
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i]
        listener(action)
      }
    }
  })

  function subscribe(cb) {
    if (typeof cb !== 'function') {
      throw "Listener must be a function";
    }

    // avoid mutating list that could be iterating during dispatch
    let subscribed = true;
    nextListeners = copyIfSame(currentListeners, nextListeners)

    nextListeners.push(cb)

    return () => {
      if (!subscribed) return
      subscribed = false

      nextListeners = copyIfSame(currentListeners, nextListeners)

      var index = nextListeners.indexOf(cb)
      nextListeners.splice(index, 1)
    }
  }

  var store = Object.assign(
    { },
    bindSelectors(name, selectors),
    {
      name,
      dispatch: (...action) => dispatch(...action),
      dispatchToken,
      subscribe,
      replaceReducer: (newReducer) => reducer = newReducer,
      setState: (state) => { updateRootState(name, state) },
      getState: function() {
        return rootState[name];
      }
    }
  )


  if (name !== '__root__') stores[name] = store;

  return store;

}

// Compose
export function composeStore(name, ...spec) {

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
  let dirty = false;

  let dispatchTokens = stores.map(n => n.dispatchToken )
  let subscriptions = stores.map(n => n.subscribe( (name, action) => {
    dirty = true
  }))

  return createStore(
    name,
    (state=defaultState, action, waitFor) => {

      waitFor(dispatchTokens)

      if (dirty) {
        let newState = getState(isMapped, ...spec)
        dirty = false;
        return newState
      }

      return state;

    }
  )
}
