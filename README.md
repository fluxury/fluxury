# fluxury

Add sugar to Facebook's implementation of Flux architecture. It adds a little luxury to simplify your life.

This library is similar to Reflux and Redux except that this library doesn't try to replace the dispatcher with a new implementation. The library encourages you into simple patterns but doesn't try to change the core concepts.

This library is an opinionated set of functions that allow you to create actions, stores and web utils.

## API

  1. Fluxory.createActions(action1, action2, ..., actionN) : Object&lt;String, Function&gt;

    Create your actions from an array of strings.

    ```js
    export default Fluxury.createActions('INC')
    ```

    This returns a object with methods that call the dispatcher along with optional data that is associated with the action.

    ```js
    var actions = {
      'INC': function INC(data) {
        return Fluxury.dispatch('INC', data);
      },
    }
    ```

    To use your action in a React component:

    ```js
    import {INC} from './MyActions'

    var React = require('react');
    var PropTypes = React.PropTypes;

    var MyComponent = React.createClass({

      handleClick: function() {
        INC()
      }

      render: function() {
        return (
          <button onClick={this.handleClick}>+1</button>
        );
      }

    });

    module.exports = MyComponent;

    ```

  2. Fluxury.createStore(name, initialState, reducer)

    Create a new store with a name and a reducer.

    ```js
    import {INC} from './MyActions'
    export default Fluxor.createStore('CountStore', 0, (state, action) => {
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
    export default Fluxury.createStore('CountStore', 0, (state, action) => {
        return state + (action.type === INC ? 1 : 0);
    })
    ```

    As previously discovered by many the reducer pattern remains a powerful tool.

  3. Fluxury.dispatch( action )

    Perhaps `{ type: 'INC', data: undefined }` isn't right for you. You can use the `Fluxury.dispatch` method directly to meet your particular need. Otherwise, use the auto generated functions created by `createActions`.

## Put it all together

```js
import {INC} from './MyActions'
import CounterStore from './CounterStore'

var React = require('react');
var PropTypes = React.PropTypes;

var MyComponent = React.createClass({

  componentWillMount: function() {
    this.listener = CounterStore.addListener( this.handleUpdate )
  },

  componentWillUnmount: function() {
    CounterStore.removeListener()
  }

  handleUpdate: function() {
    this.setState({ count: CounterStore.getState() })
  }

  handleClick: function() {
    INC()
  }

  render: function() {
    return (
      <div>
        <p>{this.state.count}</p>
        <button onClick={this.handleClick}>+1</button>
      </div>
    );
  }

});

module.exports = MyComponent;

```

That's it. This new Flux framework is a sparse 3 functions and 46 lines of commented code.

Enjoy!
