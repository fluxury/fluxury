# fluxury

[![Circle CI](https://circleci.com/gh/FunctionFoundry/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/FunctionFoundry/fluxury/tree/master)

Quick start:

```sh
npm install --save fluxury
```

```js
import {dispatch, createStore} from 'fluxury'
```

## The Gist

This library forks Flux 2.0.2; pushing you into the `(state, action) -> state` pattern.

This Flux fork focuses around 2 functions:

  - dispatch(action) or dispatch(type, data)
  - createStore(name, actionHandler, selectors) or createStore(name, defaultValue, actionHandler, selectors)

Of course it is compatible with React. Please see [React-Fluxury](https://github.com/FunctionFoundry/react-fluxury) for more information.

It is compatible with Redux. Please see [Fluxury-Redux](https://github.com/FunctionFoundry/fluxury-redux) for integration.

## API Reference

  1. dispatch( type, data ) or dispatch( action )

    Submit an action into the stores.

    ```js
    import {dispatch} from 'fluxury';

    // dispatch an action with a string
    dispatch('REQUEST_SETTINGS')  // => { type: 'LOAD_SETTINGS', data: undefined }
    // or with data
    dispatch('LOAD_SETTINGS', { a: 1, b: 2 }) // => { type: 'LOAD_SETTINGS', data: { a: 1, b: 2 } }
    // or with a custom object
    dispatch({ actionType: 'move', mode: 'off the rails' })
    ```

  3. createStore(name, initialState, reducer, methods)

    Creating a store is to Flux what creating a class is to React.

    ```js
    // actions
    const INC = 'INC'

    // fluxury magic
    import {createStore} from 'fluxury';

    // a simple counting store
    export default createStore('CountStore', (state=0, action) => {
      switch (action.type)
      case INC:
        return state + 1;
      default:
        return state;
    })
    ```

    If you do not prefer the switch boilerplate then you may specify an object with reducers.

    ```js
    const INC = 'INC'
    import {createStore} from 'fluxury';

    export default createStore(
      'Count Store',
      0,
      {
        increment: (state) => state + 1,
        decrement: (state) => state + 1
      }
    )
    ```

    In addition to the state and action the reducer function receives _waitFor_ as the third argument. The waitFor function can be used to enforce the order in store updates. See Facebook Flux documentation for more information.

## Store Properties and Methods

| name | comment |
|---------|------|
| name | The name supplied when creating the store |
| dispatchToken | A number used with waitFor |
| addListener | A function to add a callback for events |
| getState | A function that returns the current state |
| replaceState | Replace the state; use with caution |

## Put it all together

```js
var React = require('react');
var {createStore} = require('fluxury');

var countStore = createStore('CountStore', 0, {
  increment: (state) => state + 1,
  decrement: (state) => state - 1
});

var MyComponent = React.createClass({

  componentDidMount: function() {
    this.token = countStore.addListener( this.handleStoreChange );
  },

  componentWillUnmount: function() {
    this.token.remove();
  },

  handleStoreChange: function() {
    this.setState({ count: countStore.getState() })
  },

  handleUpClick: function() {
    /* Call dispatch to submit the action to the stores */
    countStore.increment())
  },

  handleDownClick: function() {
    /* Call dispatch to submit the action to the stores */
    countStore.decrement()
  },

  render: function() {
    return (
      <div>
        <p>{this.state.count}</p>
        <button onClick={this.handleUpClick}>+1</button>
        <button onClick={this.handleDownClick}>-1</button>
      </div>
    );
  }

});

module.exports = MyComponent;

```

## MapStore with defensive copies

A simple store that accumulates  data on each `SET` action.

```js
const SET = 'SET';
var {dispatch, createStore } = require('fluxury');

var mapStore = createStore('MapStore', {}, {
  SET: (state, data) => Object.assign({}, state, data)
}, {
  getStates: (state) => state.states,
  getPrograms: (state) => state.programs,
  getSelectedState: (state) => state.selectedState
});

dispatch(SET, { states: ['CA', 'OR', 'WA'] })
// store.getStates() => { states: ['CA', 'OR', 'WA']  }

dispatch(SET, { programs: [{ name: 'A', states: ['CA']}] })
// store.getPrograms() => { programs: [{ name: 'A', states: ['CA']}] }

// or use the sugar:
mapStore.SET({ selectedState: 'CA' })
// store.getSelectedState() => 'CA'

// store.getState() => { states: ['CA', 'OR', 'WA'], { states: ['CA', 'OR', 'WA'], programs: [{ name: 'A', states: ['CA']}] }, selectedState: 'CA' }

```

## MapStore with Immutable data structures

Here is a similar MapStore with Immutable.js.

```js
var {dispatch, createStore } = require('fluxury');
var {Map} = require('Immutable');

var store = createStore('MapStore', Map(), {
  set: (state, data) => state.merge(data)
}, {
  get: (state, param) => state.get(param),
  has: (state, param) => state.has(param),
  includes: (state, param) => state.includes(param),
  first: (state) => state.first(),
  last: (state) => state.last(),
  all: (state) => state.toJS(),
});
```
