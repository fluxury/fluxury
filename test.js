var test = require('tape');

test( 'fluxury', function(t) {
  var Fluxury = require('./lib/index.js')
  t.plan(12)
  t.equal(typeof Fluxury, 'object')
  t.equal(typeof Fluxury.createActions, 'function')
  t.equal(typeof Fluxury.createStore, 'function')
  t.equal(typeof Fluxury.dispatch, 'function')
  t.equal( Object.isFrozen(Fluxury), true)

  var actions = Fluxury.createActions('INC', 'DEC', 'SET'),
  INC = actions.INC,
  DEC = actions.DECs,
  SET = actions.SET;

  t.deepEqual( actions, {
    INC: 'INC',
    DEC: 'DEC',
    SET: 'SET'
  } )

  var store = Fluxury.createStore('MyStore', {}, function(state, action) {
    switch (action.type) {
      case SET:
        return Object.assign(state, action.data)
      default:
        return state;
    }
  });

  Fluxury.dispatch(SET, { foo: 1, bar: 2 })
  t.deepEqual(store.getState(), { foo: 1, bar: 2 })
  Fluxury.dispatch(SET, { foo: 2 })
  t.deepEqual(store.getState(), { foo: 2, bar: 2 })

  var store = Fluxury.createStore('CountStore', 0, function(state, action) {
    switch (action.type) {
      case INC:
        return state+1;
      case DEC:
        return state-1;
      default:
        return state;
    }
  });

  Fluxury.dispatch(INC)
  t.equal(store.getState(), 1)

  Fluxury.dispatch(INC)
  t.equal(store.getState(), 2)

  Fluxury.dispatch(DEC)
  t.equal(store.getState(), 1)

  t.deepEqual( Object.keys(store), ['name', 'dispatchToken', 'addListener', 'getState'] );
})
