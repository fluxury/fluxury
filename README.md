# fluxury

[![Circle CI](https://circleci.com/gh/WebsiteHQ/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/WebsiteHQ/fluxury/tree/master)

Quick start:

```sh
npm install --save fluxury
```

```js
import {dispatch, createStore, composeStore} from 'fluxury'
```

## The Gist

This library forks Facbook's Flux implementation.

This library adds functions:

  - dispatch(type, data) or dispatch(action) returns Promise
  - createStore(reducer, selectors) or createStore(configObject, selectors)
  - composeStore(...spec)

For react bindings please see [react-fluxury](https://github.com/FunctionFoundry/react-fluxury).

## API Reference

### dispatch( type, data ) or dispatch( action )

    Dispatch an action to all stores.

    ```js
    import {dispatch} from 'fluxury';

    // dispatch an action with a string
    dispatch('requestSettings')  // => { type: 'loadSettings', data: undefined }
    // or with data
    dispatch('loadSettings', { a: 1, b: 2 }) // => { type: 'loadSettings', data: { a: 1, b: 2 } }
    // or with a custom object
    dispatch({ type: 'move', mode: 'over rails' })
    ```

### createStore(reducerOrConfig, selectors)

    Define stores which respond to actions and manage state.

    ```js
    const inc = 'inc'
    import {createStore} from 'fluxury';

    // a simple counting store
    var countStore = createStore((state=0, action, waitFor) => {
      switch (action.type)
      case inc:
        return state + 1;
      default:
        return state;
    })
    ```

    If you do not prefer the `switch case` then may use a config object.

    The config object uses the life cycle method `getInitialState` to configure
    the initial value stored. This should look familiar to React programmers.

    ```js
    const inc = 'inc'
    import {createStore} from 'fluxury';

    export default createStore({
      getInitialState: () => 0
      increment: (state) => state + 1,
      incrementN: (state, data, waitFor) => state + data,
      decrement: (state) => state - 1
    })
    ```

    `waitFor` is used to control the order which store process actions.

### composeStore(...spec)

  Compose one or more stores into composite store.

  The spec may either be an array of stores or an Object with stores.

  ```js
  composeStores(MessageStore, CountStore)
  composeStores({ count: CountStore, message: MessageStore })
  ```

## Store Properties and Methods

| name | comment |
|---------|------|
| name | The name supplied when creating the store |
| dispatch | Another method to access the dispatch function |
| dispatchToken | A number used to identity each store |
| subscribe | Register listener and return a function to remove listener |
| getState | A function that returns the current state |
| setState | Replace the current store state |
| reduce | Run the reduce directly |

## Put it all together

```js
var React = require('react');
var {createStore} = require('fluxury');

var messageStore = createStore({
  getInitialState: () => [],
  addMessage: (state) => state + 1,
});

var messageCountStore = createStore({
  getInitialState: () => 0,
  addMessage: (state, data, waitFor) => {
    waitFor([messageStore.dispatchToken])
    return state + 1
  }
});

var MyComponent = React.createClass({

  componentDidMount: function() {
    this.unsubscribe = messageCountStore.subscribe( this.handleStoreChange );
  },

  componentWillUnmount: function() {
    this.unsubscribe();
  },

  handleStoreChange: function() {
    this.setState({ count: messageCountStore.getState() })
  },

  handleAdd: function() {
    /* Call dispatch to submit the action to the stores */
    messageStore.addMessage(this.refs.message_text.value)
  },


  render: function() {
    return (
      <div>
        <p>{this.state.count}</p>
        <input ref="message_text">
        <button onClick={this.handleAdd}>Add</button>
      </div>
    );
  }

});

module.exports = MyComponent;
```
