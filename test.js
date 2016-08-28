var test = require('tape');
var fluxury = require('./lib/fluxury')
var composeStore = fluxury.composeStore
var createStore = fluxury.createStore
var dispatch = fluxury.dispatch

test( 'fluxury', function(t) {
  t.plan(17)

  t.equal(typeof fluxury, 'object')
  t.equal(typeof fluxury.createStore, 'function')
  t.equal(typeof fluxury.dispatch, 'function')

  var inc = 'inc'
  var dec = 'dec'
  var set = 'set'

  process.env.NODE_ENV = 'development'

  var store = fluxury.createStore((state, action) => {
    state = typeof state === 'undefined' ? {} : state

    switch (action.type) {
      case set:
      // combine both objects into a single new object
      return Object.assign({}, state, action.data)
      default:
      return state;
    }
  }, {
    getFoo: (state) => state.foo,
    getBar: (state) => state.bar,
    filterHey: (state, param) => state.hey.filter((d) => d === param),
    filterNotHey: (state, param) => state.hey.filter((d) => d !== param)
  });

  var listenerCount = 0;
  store.subscribe( () => listenerCount++ )
  fluxury.dispatch(set, { foo: 1, bar: 2 })
  t.deepEqual(store.getState(), { foo: 1, bar: 2 })
  t.equal(store.getFoo(), 1)
  t.equal(store.getBar(), 2)
  fluxury.dispatch(set, { foo: 2 })
  t.deepEqual(store.getState(), { foo: 2, bar: 2 })
  fluxury.dispatch(set, { hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.getState(), { foo: 2, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  store.dispatch(set, { foo: 3 })
  t.deepEqual(store.getState(), { foo: 3, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.filterHey('go'), ['go']);
  t.deepEqual(store.filterNotHey('go'), ['ho', 'let\'s']);
  // ensure that callback is invoked correct number of times
  t.equal(listenerCount, 4);

  var store = fluxury.createStore((state=0, action) => {
    switch (action.type) {
      case inc:
      return state+1;
      case dec:
      return state-1;
      default:
      return state;
    }
  });

  fluxury.dispatch(inc)
  t.equal(store.getState(), 1)

  fluxury.dispatch(inc)
  t.equal(store.getState(), 2)

  fluxury.dispatch(dec)
  t.equal(store.getState(), 1)

  fluxury.dispatch(dec)
  t.equal(store.getState(), 0)

  t.deepEqual( Object.keys(store).sort(),  [ 'dispatch', 'dispatchToken', 'getState', 'reduce', 'setState', 'subscribe' ].sort() );
})

test('CountStore', function(t) {
  // ensure store with non-object initialState handled correctly

  var MessageCountStore = createStore({
    getInitialState: () => 0,
    receiveMessage: (count) => count + 1
  })

  t.plan(3)

  t.equals(MessageCountStore.getState(), 0)
  MessageCountStore.receiveMessage('Hello')
  t.equals(MessageCountStore.getState(), 1)
  MessageCountStore.receiveMessage('Hello')
  t.equals(MessageCountStore.getState(), 2)

})

test('ImmutableMapStore', function(t) {
  t.plan(11)

  var dispatch = fluxury.dispatch,
  Immutable = require('immutable');

  process.env.NODE_ENV = 'prod'

  // For when switch cases seem like overkill.
  var store = fluxury.createStore({
    getInitialState: () => Immutable.Map(),
    set: (state, data) => state.merge(data)
  }, {
    get: (state, param) => state.get(param),
    has: (state, param) => state.has(param),
    includes: (state, param) => state.includes(param),
    first: (state) => state.first(),
    last: (state) => state.last(),
    all: (state) => state.toJS(),
  });

  // should only be when
  t.equal(typeof store.replaceState, 'undefined')
  t.equal(typeof store.set, 'function')

  t.deepEqual( Object.keys(store).sort(), [
    'get',
    'has',
    'includes',
    'first',
    'last',
    'all',
    'getInitialState',
    'set',
    'dispatchToken',
    'subscribe',
    'reduce',
    'setState',
    'dispatch',
    'getState'
  ].sort());

  dispatch('set', { states: ['CA', 'OR', 'WA'] })
  dispatch('set', { programs: [{ name: 'A', states: ['CA']}] })
  dispatch('set', { selectedState: 'CA' })

  t.deepEqual( store.get('states').toJS(), ['CA', 'OR', 'WA']  );
  t.deepEqual( store.get('programs').toJS(), [{ name: 'A', states: ['CA']}] );
  t.deepEqual( store.get('selectedState'), 'CA' );
  t.deepEqual( store.all(), { states: ['CA', 'OR', 'WA'], programs: [{ name: 'A', states: ['CA']}] , selectedState: 'CA' } );

  t.deepEqual( store.has('states'), true );
  t.deepEqual( store.first().toJS(), ['CA', 'OR', 'WA'] );
  t.deepEqual( store.last(), 'CA' );
  t.deepEqual( store.includes('CA'), true );

})

test('waitFor and compose works correctly', function(t) {

  var dispatchCount = 0;

  t.plan(14)

  var MessageStore = createStore(function(state=[], action) {
    switch(action.type) {
      case 'loadMessage':
      return state.concat(action.data)
      default:
      return state
    }
  })

  var MessageCountStore = createStore(
    function(state=0, action, waitFor) {
      // ensure that MessageStore reducer is executed before continuing
      waitFor([MessageStore.dispatchToken])
      switch(action.type) {
        case 'loadMessage':
        return state+1
        default:
        return state
      }
    }
  )

  var Combined1 = composeStore(MessageCountStore, MessageStore)
  var Combined2 = composeStore([MessageCountStore, MessageStore])

  var Combined3 = composeStore({
    count: MessageCountStore,
    messages: MessageStore
  })

  var unsubscribe = MessageStore.subscribe(function() {
    dispatchCount += 1
  })

  t.equals( typeof unsubscribe, 'function')

  dispatch('loadMessage', 'Test')
  t.equals(MessageStore.getState().length, 1)
  t.equals(MessageCountStore.getState(), 1)
  t.deepEqual(MessageStore.getState(), ['Test'])

  dispatch('loadMessage', 'Test2')
  t.equals(MessageStore.getState().length, 2)
  t.equals(MessageCountStore.getState(), 2)
  t.deepEqual(MessageStore.getState(), ['Test', 'Test2'])

  unsubscribe()

  dispatch('loadMessage', 'Test3')
  t.equals(MessageStore.getState().length, 3)
  t.equals(MessageCountStore.getState(), 3)
  t.deepEqual(MessageStore.getState(), ['Test', 'Test2', 'Test3'])

  t.deepEqual(Combined1.getState(), [3, ['Test', 'Test2', 'Test3']])
  t.deepEqual(Combined2.getState(), [3, ['Test', 'Test2', 'Test3']])
  t.deepEqual(Combined3.getState(), { count: 3, messages: ['Test', 'Test2', 'Test3'] })

  t.equal(dispatchCount, 2)

})

test('reduce works correctly', function(t) {

  var dispatchCount = 0;

  t.plan(1)

  var MessageStore = createStore({
    loadMessage: (state, data) => state.concat(data)
  })

  t.deepEqual( MessageStore.reduce(['a'], { type: 'loadMessage', data: ['b'] }), ['a', 'b'])

})
