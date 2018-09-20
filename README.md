# fluxury

[![Circle CI](https://circleci.com/gh/fluxury/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/fluxury/fluxury/tree/master)

## Overview

State management library; works like redux but with option for many stores, side effects, Promises and other practical things.

Library includes:

- createStore(key, reducerOrSpec, actionsOrSelectors)
- dispatch(action)
- getStores()
- getReducer()
- getState()
- promiseAction(type, data)
- replaceState(state)
- subscribe(cb)

## Quick start

```sh
npm install --save fluxury
```

```js
import {
  createStore,
  dispatch,
  getStores,
  getState,
  promiseAction,
  replaceState,
  subscribe
} from "fluxury";

// creates a key="A" in the root store, connected to a reducer function.
let storeA = createStore(
  "a1",
  (state = 0, action) => (action.type === "setA" ? action.data : state)
);

let storeB = createStore(
  "b1",
  (state = 0, action) => (action.type === "setB" ? action.data : state)
);

// Store with dependencies on state in storeA and storeB.
let storeC = createStore("c1", (state = 0, action, waitFor) => {
  // Ensure storeA and storeB reducers run prior to continuing.
  waitFor([storeA.dispatchToken, storeB.dispatchToken]);

  // Side effect! Get state from other stores.
  return storeA.getState() + storeB.getState();
});

subscribe((...args) => console.log("action", ...args));
dispatch("setA", 2);
dispatch("setB", 2);
getState(); // -> { a1: 2, b1: 2, c1: 4 }
```

## Polyfills

This library depends on a modern JavaScript runtime. Load a polyfill like in [core-js](https://github.com/zloirock/core-js#commonjs) or [babel-polyfill](http://babeljs.io/docs/usage/polyfill/) to support old browsers.

Manually install required polyfills with [core-js](https://github.com/zloirock/core-js):

```js
require("core-js/fn/promise");
require("core-js/fn/object/assign");
require("core-js/fn/object/freeze");
require("core-js/fn/object/keys");
```

## API

### createStore( key, reducerOrSpec, actionsOrSelectors )

A store responds to actions by returning the next state.

```js
const inc = 'inc'
import {createStore} from 'fluxury';

// a simple counting store
var store = createStore( "count", (state=0, action) => {
  switch (action.type)
  case inc:
    return state + 1;
  case incN:
    return state + action.data;
  default:
    return state;
}, {
  inc: (state) => dispatch('inc'),
  incN: (state, count) => dispatch('incN', count),
})

// the store includes a reference to dispatch
store.dispatch('inc')

// optionally, define action creators into the store.
store.inc()
```

Optionally, you may define a store with a specification.

```js
const inc = "inc";
import { createStore } from "fluxury";

// a simple counting store
var countStore = createStore("count", {
  // life-cycle method for initialization.
  getInitialState: () => 0,
  // handles { type: 'inc' }
  inc: state => state + 1,
  // handles { type: 'incN' }
  incN: (state, n) => state + n
});

// object spec makes action creators automatically...
countStore.inc();
countStore.incN(10);
```

### dispatch( action )

The entry point to effecting state changes in the app is when an action is dispatch.

Dispatch accepts action as object, promise, or type/data; returns promise.

```js
// Import the dispatch function.
var { dispatch } = require( 'fluxury' )

// Dispatch action as object
dispatch( { type: 'openPath', '/user/new' } )
.then( action => console.log('Going', action.data) )

// Dispatch action as promise
dispatch( Promise.resolve({ type: 'get', mode: 'off the juice' }) )

// Dispatch action with type:string and data:object.
dispatch( 'loadSettings', { a: 1, b: 2 } )
```

#### Store Properties

Here is a list of store properties that are part of the public API.

| name           | comment                             |
| -------------- | ----------------------------------- |
| name           | The name of the store               |
| dispatch       | Access to dispatch function         |
| dispatchToken  | A number used to identity the store |
| subscribe      | A function to tegister a listener   |
| getState       | A function to access state          |
| setState       | Replace the store's state           |
| replaceReducer | Replace the store's reducer         |

### getStores( )

Returns an object with the name as key and store as value.

### replaceState( state )

Rehydrate the root state.

```js
replaceState({
  MyCountStore: 1
});
```

### subscribe( listener )

Listen to changes to all stores. This will trigger once each time createStore or dispatch is invoked.

_Please note that action will be undefined when createStore is invoked._

```
var unsubscribe = subscribe( (state, action) => {
  // got change
})

// stop listening
unsubscribe()
```

### getReducer( )

Return app's reducer function, use with Redux.
