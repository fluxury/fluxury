# pure-flux

[![Circle CI](https://circleci.com/gh/PureFlux/pure-flux/tree/master.svg?style=svg)](https://circleci.com/gh/PureFlux/pure-flux/tree/master)

## Overview

A Flux library that promotes `(state, action) => state`. It is a state management library composed of immutable stores.

It forks [Facebook's Flux](https://facebook.github.io/flux/) v2.0.2 adding functions to define stores, manage state and register listeners.

There is no debate. It is Flux architecture with the original dispatcher behind the curtains.

The library includes:

  - createStore( name, reducerOrSpec, actionsOrSelectors )
  - composeStore( name, ...spec )
  - dispatch( action )
  - getStores( )
  - getState( )
  - promiseAction( type, data )
  - replaceState( state )
  - subscribe( cb )

For react bindings see [react-pure-flux](https://github.com/WebsiteHQ/react-pure-flux).

A complete router for React can be found at [pure-flux-router](https://github.com/WebsiteHQ/pure-flux-router)

For working examples [read the tests](./test.js).

## Quick start

```sh
npm install --save pure-flux
```

```js
import {
  createStore,
  composeStore,
  dispatch,
  getStores,
  getState,
  promiseAction,
  replaceState,
  subscribe
}
from 'pure-flux'
```

## Polyfills

This library depends on a modern JavaScript runtime. Load a polyfill like in [core-js](https://github.com/zloirock/core-js#commonjs) or [babel-polyfill](http://babeljs.io/docs/usage/polyfill/) to support old browsers.

Install required polyfills with [core-js](https://github.com/zloirock/core-js):

```js
require('core-js/fn/promise');
require('core-js/fn/object/assign');
require('core-js/fn/object/freeze');
require('core-js/fn/object/keys');
```

## API

### dispatch( action )

Dispatch action, returns a Promise which may be used to chain actions together.

```js
var { dispatch } = require( 'pure-flux' )

// With an object
dispatch( { type: 'move', data: 'off the rails' } )
.then( action => console.log('Going', action.data) )

// With a Promise
dispatch( Promise.resolve({ type: 'get', mode: 'off the juice' }) )

// With type and data
dispatch( 'loadSettings', { a: 1, b: 2 } )

```

### createStore( name, reducerOrSpec, actionsOrSelectors )

A store responds to actions by returning the next state.

```js
const inc = 'inc'
import {createStore} from 'pure-flux';

// a simple counting store
var store = createStore( "CountStoreWithReducer", (state=0, action) => {
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
const inc = 'inc'
import { createStore } from 'pure-flux';

// a simple counting store
var countStore = createStore( "CountStoreWithSpec", {
  getInitialState: () => 0,
  inc: (state) => state+1,
  incN: (state, n) => state+n,
})

// object spec makes action creators automatically...
countStore.inc()
countStore.incN(10)
```

The specification includes the life-cycle method `getInitialState` which is invoked once when the store is created.

Additional functions are invoked when the `action.type` matches the key in the spec.

_Do not try to mutate the state object. It is frozen._

#### Store Properties

| name | comment |
|---------|------|
| name | The name of the store |
| dispatch | Access to dispatch function |
| dispatchToken | A number used to identity the store |
| subscribe | A function to tegister a listener |
| getState | A function to access state |
| setState | Replace the store's state |
| replaceReducer | Replace the store's reducer |

### composeStore( name, ...spec )

Compose two or more stores into composite store with a specification.

#### Object specification
```js
// object spec
composeStores(
  "MyCombinedObjectStore", {
    count: CountStore,
    messages: MessageStore
  }
)

// Returns state as object:
// {
//   count: {CountStore.getState()},
//   messages: {MessageStore.getState()}
// }
```

#### Array specification

```js
// list spec
composeStores( "MyCombinedListStore", CountStore, MessageStore )

// Returns state as array:
// [
//   {CountStore.getState()},
//   {MessageStore.getState()}
// ]
```

### getStores( )

Returns an object with the name as key and store as value.

### replaceState( state )

Rehydrate the root state.

```js
replaceState({
  'MyCountStore': 1
})
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

## Final thought

If you got this far then I hope you enjoy this library and build something amazing.

If you do please let me know!
