var test = require('tape-async');
var pf = require('./lib/index')
var getStores = pf.getStores
var getStore = pf.getStore
var composeStore = pf.composeStore
var createStore = pf.createStore
var dispatch = pf.dispatch

test( 'pf', function* (t) {
  t.plan(19)

  t.equal(typeof pf, 'object')
  t.equal(typeof pf.createStore, 'function')
  t.equal(typeof pf.dispatch, 'function')

  var inc = 'inc'
  var dec = 'dec'
  var set = 'set'

  process.env.NODE_ENV = 'development'

  var store = pf.createStore("test1SetStore", (state, action) => {
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
  var result = yield pf.dispatch(set, { foo: 1, bar: 2 })
  t.equal( result.type, set, 'promise should resolve to action with type' )
  t.deepEqual( result.data, { foo: 1, bar: 2 }, 'promise should resolve to action with data' )

  t.deepEqual(store.getState(), { foo: 1, bar: 2 })
  t.equal(store.getFoo(), 1)
  t.equal(store.getBar(), 2)
  pf.dispatch(set, { foo: 2 })
  t.deepEqual(store.getState(), { foo: 2, bar: 2 })
  pf.dispatch(set, { hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.getState(), { foo: 2, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  store.dispatch(set, { foo: 3 })
  t.deepEqual(store.getState(), { foo: 3, bar: 2, hey: ['ho', 'let\'s', 'go'] })
  t.deepEqual(store.filterHey('go'), ['go']);
  t.deepEqual(store.filterNotHey('go'), ['ho', 'let\'s']);
  // ensure that callback is invoked correct number of times
  t.equal(listenerCount, 4);

  var store = pf.createStore("test1CountStore", (state=0, action) => {
    switch (action.type) {
      case inc:
      return state+1;
      case dec:
      return state-1;
      default:
      return state;
    }
  });

  pf.dispatch(inc)
  t.equal(store.getState(), 1)

  pf.dispatch(inc)
  t.equal(store.getState(), 2)

  pf.dispatch(dec)
  t.equal(store.getState(), 1)

  pf.dispatch(dec)
  t.equal(store.getState(), 0)

  t.deepEqual( Object.keys(store).sort(),  [ 'dispatch', 'dispatchToken', 'getState', 'name', 'replaceReducer', 'setState', 'subscribe' ].sort() );


})

test('CountStore', function(t) {
  // ensure store with non-object initialState handled correctly

  var MessageCountStore = createStore("test2MessageCountStore", (count=0, action) => {
    switch(action.type) {
      case 'receiveMessage': return count + 1;
      default: return count
    }
  })

  t.plan(3)

  t.equals(MessageCountStore.getState(), 0)
  MessageCountStore.dispatch('receiveMessage', 'Hello')
  t.equals(MessageCountStore.getState(), 1)
  MessageCountStore.dispatch('receiveMessage', 'Hello')
  t.equals(MessageCountStore.getState(), 2)

})

test('ImmutableMapStore', function(t) {
  t.plan(10)

  var dispatch = pf.dispatch,
  Immutable = require('immutable');

  process.env.NODE_ENV = 'prod'

  // For when switch cases seem like overkill.
  var store = pf.createStore("test3ImmutableMapStore", (state=Immutable.Map(), action) => {
    switch(action.type) {
      case 'set': return state.merge(action.data);
      default: return state
    }
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

  t.deepEqual( Object.keys(store).sort(), [
    'get',
    'has',
    'includes',
    'first',
    'last',
    'all',
    'dispatchToken',
    'subscribe',
    'name',
    'replaceReducer',
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

test('waitFor, compose and events works correctly', function* (t) {

  var dispatchCount = 0, dispatchCount2 = 0;

  t.plan(21) // blackjack!

  var MessageStore = createStore("test4MessageStore", function(state=[], action) {
    switch(action.type) {
      case 'loadMessage':
      return state.concat(action.data)
      default:
      return state
    }
  })

  var MessageCountStore = createStore(
    "test4MessageCountStore",
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

  var Combined1 = composeStore("Combined1", MessageCountStore, MessageStore)
  var Combined2 = composeStore("Combined2", [MessageCountStore, MessageStore])

  var Combined3 = composeStore("Combined3", {
    count: MessageCountStore,
    messages: MessageStore
  })

  var unsubscribe = MessageStore.subscribe(function() {
    dispatchCount += 1
  })

  var unsubscribe2 = MessageCountStore.subscribe(function() {
    dispatchCount2 += 1
  })

  t.equals( typeof unsubscribe, 'function')

  dispatch('loadMessage', 'Test')
  t.equals(MessageStore.getState().length, 1)
  t.equals(MessageCountStore.getState(), 1)
  t.deepEqual(MessageStore.getState(), ['Test'])
  t.equal(dispatchCount, 1)
  t.equal(dispatchCount2, 1)

  dispatch('foo', 'Test')

  t.equal(dispatchCount, 1)
  t.equal(dispatchCount2, 1)

  unsubscribe2()

  dispatch('loadMessage', 'Test2')
  t.equals(MessageStore.getState().length, 2)
  t.equals(MessageCountStore.getState(), 2)
  t.deepEqual(MessageStore.getState(), ['Test', 'Test2'])
  t.equal(dispatchCount, 2)
  t.equal(dispatchCount2, 1)

  unsubscribe()

  var result = yield dispatch( Promise.resolve({ type: 'loadMessage', data: 'Test3'}) )

  t.equals(MessageStore.getState().length, 3)
  t.equals(MessageCountStore.getState(), 3)
  t.deepEqual(MessageStore.getState(), ['Test', 'Test2', 'Test3'])

  t.deepEqual(Combined1.getState(), [3, ['Test', 'Test2', 'Test3']])
  t.deepEqual(Combined2.getState(), [3, ['Test', 'Test2', 'Test3']])
  t.deepEqual(Combined3.getState(), { count: 3, messages: ['Test', 'Test2', 'Test3'] })

  t.equal(dispatchCount, 2)
  t.equal(dispatchCount2, 1)

})

test('check root store', function(t) {
  t.plan(7)
  var rootStore = composeStore("master", getStores())
  t.equal(Object.keys(rootStore.getState()).length, 9)
  t.equal(getStore("master").name, "master")

  var rootStore2 = composeStore("master2", getStores())
  t.equal(Object.keys(rootStore2.getState()).length, 10)

  // second time should include itself
  rootStore2 = composeStore("master2", getStores())
  t.equal(Object.keys(rootStore2.getState()).length, 11)

  // third and more makes no difference
  rootStore2 = composeStore("master2", getStores())
  t.equal(Object.keys(rootStore2.getState()).length, 11)

  var count = 0;

  var rootListener = rootStore.subscribe(() => count++)
  dispatch('no-action-here', 'Test3')

  t.equal(count, 0)

  dispatch('loadMessage', 'Test3')

  t.equal(count, 1)


})
