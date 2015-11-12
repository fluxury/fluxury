# fluxury

[![Circle CI](https://circleci.com/gh/fluxury/fluxury/tree/master.svg?style=svg)](https://circleci.com/gh/fluxury/fluxury/tree/master)

Add sugar to Facebook's implementation of Flux architecture. It adds a little luxury to simplify your life.

This library is similar to Reflux and Redux except that this library doesn't try to replace the dispatcher with a new implementation. The library encourages you into simple patterns but doesn't try to change the core concepts.

This library is an opinionated set of functions that allow you to easily define actions and stores; and singleton dispatcher to publish actions to the stores.

This new "Flux framework" adds a surface area of 3 functions.

## API

  1. Fluxury.dispatch( type, data )

    Submit an action into the stores. You must specify the type and, optionally, some data.

    ```js
    Fluxury.dispatch('REQUEST_SETTINGS')
    // or with data
    Fluxury.dispatch('LOAD_SETTINGS', { a: 1, b: 2 })
    ```

  2. Fluxory.createActions(action1, action2, ..., actionN)

    Create your actions from a list of strings as `arguments`.

    _MyActions.js_
    ```js
    export default Fluxury.createActions('INC', 'DEC', 'SET')
    ```

    This returns a key mirrored object.

    ```js
    {
      INC: 'INC',
      DEC: 'DEC',
      SET: 'SET'
    }
    ```

    To use the action in a React component:

    ```js
    import {INC} from './MyActions'

    var React = require('react');
    var Fluxury = require('fluxury');
    var PropTypes = React.PropTypes;

    var MyComponent = React.createClass({

      handleClick: function() {
        /* Call dispatch to submit the action to the stores */
        Fluxury.dispatch(INC)
      }

      render: function() {
        return (
          <button onClick={this.handleClick}>+1</button>
        );
      }

    });

    module.exports = MyComponent;

    ```

  3. Fluxury.createStore(name, initialState, reducer)

    Create a new store with a name and a reducer.

    ```js
    import {INC} from './MyActions'
    export default Fluxor.createStore('CountStore', 0, function(state, action) {
      if (action.type === INC) {
        return state + 1;
      }
      return state;
    })
    ```

    Perhaps you prefer the class switch case:

    ```js
    import {INC} from './MyActions'
    export default Fluxury.createStore('CountStore', 0, (state, action) => {
      switch (action.type)
      case INC:
        return state + 1;
      default:
        return state;
    })
    ```

    In this example you can make them both disappear:

    ```js
    import {INC} from './MyActions'
    export default Fluxury.createStore('CountStore', 0, function(state, action) {
        return state + (action.type === INC ? 1 : 0);
    })
    ```

    As previously discovered by many the reducer pattern remains a powerful tool.



## MapStore Example

For simple projects with limited datasets you may be best suited to use a
single store for the entire application. After all, you can nest the object as
deeply as needed to organize and isolate your data.

```js
var Fluxury = require('fluxury');

// no need for Fluxury.createActions when you have a single action!
var SET = 'SET';

var store = Fluxury.createStore('MapStore', {}, function(state, action) {
  switch (action.type) {
    case SET:
      return Object.assign(state, action.data)
    default:
      return state;
  }
});

Fluxury.dispatch(SET, { states: ['CA', 'OR', 'WA'] })
// store.getState() => { states: ['CA', 'OR', 'WA']  }

Fluxury.dispatch(SET, { selectedState: 'CA' })
// store.getState() => { states: ['CA', 'OR', 'WA'], selectedState: 'CA' }
```
