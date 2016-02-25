import {createStore} from '../index';

export default createStore('CountStore', 0, {
  increment: (state) => state + 1,
  decrement: (state) => state - 1,
  set: (state, action) => action.data
})
