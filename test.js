var test = require('tape');

test( 'fluxury', function(t) {
  var Fluxury = require('./lib/index.js')
  t.plan(15)

  t.equal(typeof Fluxury, 'object')
  t.equal(typeof Fluxury.createActions, 'function')
  t.equal(typeof Fluxury.createStore, 'function')
  t.equal(typeof Fluxury.dispatch, 'function')
  t.equal( Object.isFrozen(Fluxury), true)

  var actions = Fluxury.createActions('INC', 'DEC', 'SET'),
  INC = actions.INC,
  DEC = actions.DEC,
  SET = actions.SET;

  t.deepEqual( actions, {
    INC: 'INC',
    DEC: 'DEC',
    SET: 'SET'
  } )

  var store = Fluxury.createStore('MapStore', {}, function(state, action) {
    var assign = require('object-assign');
      switch (action.type) {
      case SET:
        return assign({}, state, action.data)
      default:
        return state;
    }
  });

  Fluxury.dispatch(SET, { foo: 1, bar: 2 })
  t.deepEqual(store.getState(), { foo: 1, bar: 2 })
  Fluxury.dispatch(SET, { foo: 2 })
  t.deepEqual(store.getState(), { foo: 2, bar: 2 })
  Fluxury.dispatch(SET, { hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.getState(), { foo: 2, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  Fluxury.dispatch(SET, { foo: 3 })
  t.deepEqual(store.getState(), { foo: 3, bar: 2, hey: ['ho', 'let\'s', 'go'] })

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

  Fluxury.dispatch(DEC)
  t.equal(store.getState(), 0)

  t.deepEqual( Object.keys(store), ['name', 'dispatchToken', 'addListener', 'getState'] );
})
