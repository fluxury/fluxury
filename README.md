# fluxury

[![Circle CI](https://circleci.com/gh/fluxury/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/fluxury/fluxury/tree/master)

Quick start:

```sh
npm install --save fluxury
```

```js
import {dispatch, createStore} from 'fluxury'
```

## The Gist

This library adds 2 functions to Facebook's flux implementation to guide you into the `(state, action) -> state` pattern.

In flux@2.1, Facebook added 3 new abstract ES 2015 classes (FluxMapStore -> FluxReduceStore -> FluxStore). These stores guide you into the reducer pattern but, unfortunately, they also lead you into classes. This library reimplements the FluxReduceStore in Douglas Crockford's class-free object oriented programming style. The FluxMapStore can be implemented using defensive copies or with immutable data structures. Examples for both techniques are included below.

This library is similar to Reflux and Redux except that this library doesn't try to replace the dispatcher with a new implementation. The library encourages you into simple patterns but doesn't try to change the core concepts. The flux/Dispatcher and fbemitter/EventEmitter modules are the key to Flux and this project depends directly on Facebook's implementations.  

This new "Flux framework" adds a surface area of 2 new functions:

  - dispatch
  - createStore

Enjoy!

## API Reference

  1. dispatch( type, data ) or dispatch( action )

    Submit an action into the stores. You must specify the type and, optionally, some data.

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

    Create a new store with a name, initialState, reducer function and an object with methods that maybe used to operate state.

    ```js
    // actions
    const INC = 'INC'

    // fluxury magic
    import {createStore} from 'fluxury';

    // a simple counting store
    export default createStore('CountStore', 0, (state, action) => {
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

    export default createStore('CountStore', 0, {
      INC: (state) => state + 1
    })

    // To trigger an increment action use:
    // dispatch('INC') or dispatch({ type: 'INC' })
    ```

    In addition to the state and action the reducer function receives _waitFor_ as the third argument. The waitFor function can be used to enforce the order in store updates. See Facebook Flux documentation for more information.

## Store Properties and Methods

| name | comment |
|---------|------|
| name | The name supplied when creating the store |
| dispatchToken | A number used with waitFor |
| addListener | A function to add a callback for events |
| getState | A function that returns the current state |

## Put it all together

```js
const {INC, DEC} = ['INC', 'DEC'];
var React = require('react');
var {dispatch, createStore} = require('fluxury');
var PureRenderMixin = require('react-addons-pure-render-mixin');


var countStore = createStore('CountStore', 0, {
  INC: (state) => state + 1,
  DEC: (state) => state - 1
});

var MyComponent = React.createClass({

  mixins: [PureRenderMixin],

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
    dispatch(INC)
  },

  handleDownClick: function() {
    /* Call dispatch to submit the action to the stores */
    dispatch(DEC)
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

var store = createStore('MapStore', {}, {
  SET: (state) => Object.assign({}, state, action.data)
}, {
  getStates: (state) => state.states,
  getPrograms: (state) => state.programs,
  getSelectedState: (state) => state.selectedState
});

dispatch(SET, { states: ['CA', 'OR', 'WA'] })
// store.getStates() => { states: ['CA', 'OR', 'WA']  }

dispatch(SET, { programs: [{ name: 'A', states: ['CA']}] })
// store.getPrograms() => { programs: [{ name: 'A', states: ['CA']}] }

dispatch(SET, { selectedState: 'CA' })
// store.getSelectedState() => 'CA'

// store.getState() => { states: ['CA', 'OR', 'WA'], { states: ['CA', 'OR', 'WA'], programs: [{ name: 'A', states: ['CA']}] }, selectedState: 'CA' }

```

## MapStore with Immutable data structures

Here is a similar MapStore with Immutable.js.

```js
const {SET, DELETE} = ['SET', 'DELETE'];
var {dispatch, createStore } = require('fluxury');
var {Map} = require('Immutable');

var store = createStore('MapStore', Map(), {
  SET: (state) => state.merge(action.data)
}, {
  get: (state, param) => state.get(param),
  has: (state, param) => state.has(param),
  includes: (state, param) => state.includes(param),
  first: (state) => state.first(),
  last: (state) => state.last(),
  all: (state) => state.toJS(),
});
```
