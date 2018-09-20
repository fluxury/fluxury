/* fluxury - Copyright 2015-2018 JC Fisher */
"use strict";

// Based on Facebook's Flux dispatcher class.
function Dispatcher() {
  let lastId = 1;
  let prefix = "ID_";
  let callbacks = {};
  let isPending = {};
  let isHandled = {};
  let isDispatching = false;
  let pendingPayload = null;

  function invokeCallback(id) {
    isPending[id] = true;
    callbacks[id](pendingPayload);
    isHandled[id] = true;
  }

  this.register = callback => {
    let id = prefix + lastId++;
    callbacks[id] = callback;
    return id;
  };

  this.unregister = id => {
    if (!callbacks.hasOwnProperty(id))
      return new Error("Cannot unregister unknown ID!");
    delete callbacks[id];
    return id;
  };

  this.waitFor = ids => {
    for (var i = 0; i < ids.length; i++) {
      var id = ids[id];
      if (isPending[id]) {
        return new Error("Circular dependency waiting for " + id);
      }

      if (!callbacks[id]) {
        return new Error(`waitFor: ${id} is not a registered callback.`);
      }

      invokeCallback(id);
    }

    return undefined;
  };

  this.dispatch = payload => {
    if (isDispatching) return new Error("Cannot dispatch while dispatching.");

    // start
    for (var id in callbacks) {
      isPending[id] = false;
      isHandled[id] = false;
    }

    pendingPayload = payload;
    isDispatching = true;

    // run each callback.
    try {
      for (var id in callbacks) {
        if (isPending[id]) continue;
        invokeCallback(id);
      }
    } finally {
      pendingPayload = null;
      isDispatching = false;
    }

    return payload;
  };
}

let rootState = Object.freeze({}),
  stores = {},
  dispatcher = new Dispatcher(),
  waitFor = dispatcher.waitFor.bind(dispatcher),
  rootListeners = [],
  rootNextListeners = [];

function copyIfSame(current, next) {
  if (current === next) return current.slice();
  return next;
}

function updateRootState(name, newState) {
  var changes = {};
  changes[name] =
    typeof newState === "object" ? Object.freeze(newState) : newState;
  rootState = Object.assign({}, rootState, changes);
}

function rootNotify(action) {
  // notify root listeners
  var listeners = (rootListeners = rootNextListeners);
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    listener(rootState, action);
  }
}

export function subscribe(cb) {
  if (typeof cb !== "function") {
    throw "Listener must be a function";
  }

  // avoid mutating list that could be iterating during dispatch
  let subscribed = true;
  rootNextListeners = copyIfSame(rootListeners, rootNextListeners);

  rootNextListeners.push(cb);

  return () => {
    if (!subscribed) return;
    subscribed = false;

    rootNextListeners = copyIfSame(rootListeners, rootNextListeners);

    var index = rootNextListeners.indexOf(cb);
    rootNextListeners.splice(index, 1);
  };
}

export function promiseAction(type, data) {
  return Promise.resolve({ type, data });
}

export function replaceState(newState) {
  rootState = newState;
}

export function dispatch(action, data) {
  try {
    if (typeof action === "object" && typeof action.then === "function") {
      return action.then(result => {
        dispatch(result);
        return Promise.resolve(result);
      });
    } else if (typeof action === "object") {
    } else if (typeof action === "string") {
      action = { type: action, data: data };
    } else {
      return Promise.reject("Invalid action!");
    }

    // keep a reference to current rootState
    let currentState = rootState;

    // dispatch the action to the core dispatcher.
    dispatcher.dispatch(action);

    // notify if root state changes!
    if (currentState !== rootState) {
      rootNotify(action);
    }

    // Return a promise that resolves to the action.
    return Promise.resolve(action);
  } catch (e) {
    return Promise.reject(e);
  }
}

// construct a reducer method with a spec
function makeReducer(spec) {
  return (state, action) => {
    // Check if action has definition and run it if available.
    if (
      action &&
      typeof action.type === "string" &&
      spec.hasOwnProperty(action.type)
    ) {
      return spec[action.type](state, action.data, waitFor);
    }

    // Return current state when action has no handler.
    return state;
  };
}

function bindSelectors(name, selectors) {
  return Object.keys(selectors).reduce(function(a, b, i) {
    var newFunc = {};
    newFunc[b] = function(...params) {
      return selectors[b](rootState[name], ...params);
    };
    return Object.assign(a, newFunc);
  }, {});
}

export function getState() {
  return rootState;
}

export function getStores() {
  return stores;
}

export function createStore(name, reducerOrSpec, selectors = {}) {
  if (typeof name !== "string") throw "Expect name to be string.";
  if (typeof reducerOrSpec !== "function" && typeof reducerOrSpec !== "object")
    throw "Expect reducer to be function or object spec.";
  if (typeof selectors !== "object") throw "Expect selectors to be object.";

  let isSpec = typeof reducerOrSpec === "object",
    reducer = isSpec ? makeReducer(reducerOrSpec) : reducerOrSpec,
    actions = {},
    currentListeners = [],
    nextListeners = [];

  updateRootState(
    name,
    isSpec
      ? reducerOrSpec.getInitialState
        ? reducerOrSpec.getInitialState()
        : undefined
      : reducer(undefined, {}, () => {})
  );

  rootNotify(undefined);

  var dispatchToken = dispatcher.register(function(action) {
    var newState = reducer(rootState[name], action, waitFor);
    if (rootState[name] !== newState) {
      updateRootState(name, newState);

      // avoid looping over potentially mutating list
      var listeners = (currentListeners = nextListeners);
      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];
        listener(newState, action);
      }
    }
  });

  function subscribe(cb) {
    if (typeof cb !== "function") {
      throw "Listener must be a function";
    }

    // avoid mutating list that could be iterating during dispatch
    let subscribed = true;
    nextListeners = copyIfSame(currentListeners, nextListeners);

    nextListeners.push(cb);

    return () => {
      if (!subscribed) return;
      subscribed = false;

      nextListeners = copyIfSame(currentListeners, nextListeners);

      var index = nextListeners.indexOf(cb);
      nextListeners.splice(index, 1);
    };
  }

  if (isSpec) {
    // create helpful action methods
    actions = Object.keys(reducerOrSpec).reduce((a, b) => {
      if (b === "getInitialState") return a;
      a[b] = data =>
        dispatch({
          type: b,
          data: data
        });
      return a;
    }, {});
  }

  var store = Object.assign({}, actions, bindSelectors(name, selectors), {
    name,
    dispatch: (...action) => dispatch(...action),
    dispatchToken,
    subscribe,
    replaceReducer: newReducer => (reducer = newReducer),
    setState: state => {
      updateRootState(name, state);
    },
    getReducer: () => reducer,
    getState: function() {
      return rootState[name];
    }
  });

  if (name[0] !== "_") stores[name] = store;

  return store;
}
