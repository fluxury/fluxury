# pure-flux

[![Circle CI](https://circleci.com/gh/WebsiteHQ/pure-flux/tree/master.svg?style=svg)](https://circleci.com/gh/WebsiteHQ/pure-flux/tree/master)

## Overview

A Flux library that promotes the `(state, action) => state` pattern.

This library includes:

  - createStore(name, reducer, selectors)
  - composeStore(name, ...spec)
  - dispatch(type, data) or dispatch(action) returns Promise
  - getStore()
  - getStores(name)

For react bindings see [react-pure-flux](https://github.com/FunctionFoundry/react-pure-flux).


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
  getStore
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

### dispatch( type, data ) or dispatch( action ) or dispatch( Promise )

Dispatch an action to the stores.

```js
import {dispatch} from 'pure-flux';

// dispatch an action with a string
dispatch('requestSettings')  // => { type: 'loadSettings', data: undefined }
// or with data
dispatch('loadSettings', { a: 1, b: 2 }) // => { type: 'loadSettings', data: { a: 1, b: 2 } }

// or with a custom object
dispatch({ type: 'move', mode: 'over rails' })

// or dispatch an async action with a Promise
dispatch( Promise.resolve({ type: 'move', mode: 'over rails' }) )
```

### createStore(name, reducer, selectors)

Define a store which respond to actions by returning the existing state or a new state object.

```js
const inc = 'inc'
import {createStore} from 'pure-flux';

// a simple counting store
var countStore = createStore((state=0, action) => {
switch (action.type)
case inc:
  return state + 1;
default:
  return state;
})
```

_You should not mutate the state object. It is frozen to avoid problems._

### composeStore(name, ...spec)

Compose two or more stores into composite store with a specification.

```js
// object spec
composeStores(
  "MyCombinedObjectStore", {
    count: CountStore,
    message: MessageStore
  }
)

// list spec
composeStores("MyCombinedListStore", CountStore, MessageStore )
```

## Store Properties

| name | comment |
|---------|------|
| name | The name supplied when creating the store |
| dispatch | Access to dispatch function |
| dispatchToken | A number used to identity each store |
| subscribe | A function to tegister a listener |
| getState | A function to access state |
| setState | Replace the store's state |
| replaceReducer | Replace the store's reducer |
