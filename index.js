import {EventEmitter} from 'fbemitter';
import {Dispatcher} from 'flux';
var dispatcher = new Dispatcher();
var changedEvent = 'change';

export default function Fluxury(config) {
  return Object.freeze({
    /* thin bridge to internal dispatcher */
    dispatch: function(action) {
      dispatcher.dispatch(action)
    },
    /* transform a list of actions into useful functions */
    createActions: function(actions) {
      return actions.reduce(function(a,b) {
        return a[b] = function(data) {
          return dispatcher.dispatch({ type: b, data: data })), {});
        }
      }
    },
    /* create a named store with an initialState and a reducer to move it forward */
    createStore: function(name, initialState, reducer, waitFor=[]) {
      var currentState = {};
      var emitter = new EventEmitter();
      var subscription;

      var dispatchToken = dispatcher.register( function(action) {
        dispatcher.waitFor(waitFor);
        var newState = reducer(currentState, action);
        if (currentState !== newState) {
          emitter.emit(changedEvent);
        }
      });

      return Object.freeze({
        name: name,
        dispatchToken: dispatchToken,
        addListener: function(cb) {
          subscription = emitter.addListener(changedEvent, cb)
        },
        removeListener: function() {
          if (subscription) {
            subscription.remove();
          }
        }
        getState: function(cb) {
          return currentState;
        }
      });

    }
  })
}
