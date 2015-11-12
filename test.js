var test = require('tape');

test( 'fluxury', function(t) {
  var Fluxury = require('./lib/index.js')
  t.plan(7)
  t.equal(typeof Fluxury, 'object')
  t.equal(typeof Fluxury.createActions, 'function')
  t.equal(typeof Fluxury.createStore, 'function')
  t.equal(typeof Fluxury.dispatch, 'function')
  t.equal( Object.isFrozen(Fluxury), true)

  var actions = Fluxury.createActions('INC', 'DEC', 'SET'),
  INC = actions.INC,
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

  var store = Fluxury.createStore('CountStore', {}, function(state, action) {
    switch (action.type) {
      case INC:
        return state+1;
      case DEC:
        return state-1;
      default:
        return state;
    }
  });

  t.deepEqual( Object.keys(store), ['name', 'dispatchToken', 'addListener', 'getState'] );
})
