var test = require("tape-async");
var pf = require("./lib/index");
var getState = pf.getState;
var getStores = pf.getStores;
var createStore = pf.createStore;
var dispatch = pf.dispatch;
var replaceState = pf.replaceState;
var subscribe = pf.subscribe;
test("Basic Tests", function*(t) {
  t.plan(19);

  t.equal(typeof pf, "object");
  t.equal(typeof pf.createStore, "function");
  t.equal(typeof pf.dispatch, "function");

  var inc = "inc";
  var dec = "dec";
  var set = "set";

  process.env.NODE_ENV = "development";

  var store = pf.createStore(
    "test1SetStore",
    (state, action) => {
      switch (action.type) {
        case set:
          // combine both objects into a single new object
          return Object.assign({}, state, action.data);
        default:
          return state;
      }
    },
    {
      getFoo: state => state.foo,
      getBar: state => state.bar,
      filterHey: (state, param) => state.hey.filter(d => d === param),
      filterNotHey: (state, param) => state.hey.filter(d => d !== param)
    }
  );

  var listenerCount = 0;
  store.subscribe(() => listenerCount++);
  var result = yield pf.dispatch(set, { foo: 1, bar: 2 });
  t.equal(result.type, set, "promise should resolve to action with type");
  t.deepEqual(
    result.data,
    { foo: 1, bar: 2 },
    "promise should resolve to action with data"
  );

  t.deepEqual(store.getState(), { foo: 1, bar: 2 });
  t.equal(store.getFoo(), 1);
  t.equal(store.getBar(), 2);
  dispatch(set, { foo: 2 });
  t.deepEqual(store.getState(), { foo: 2, bar: 2 });
  pf.dispatch(set, { hey: ["ho", "let's", "go"] });
  t.deepEqual(store.getState(), { foo: 2, bar: 2, hey: ["ho", "let's", "go"] });
  store.dispatch(set, { foo: 3 });
  t.deepEqual(store.getState(), { foo: 3, bar: 2, hey: ["ho", "let's", "go"] });
  t.deepEqual(store.filterHey("go"), ["go"]);
  t.deepEqual(store.filterNotHey("go"), ["ho", "let's"]);
  // ensure that callback is invoked correct number of times
  t.equal(listenerCount, 4);

  var store = pf.createStore("test1CountStore", (state = 0, action) => {
    switch (action.type) {
      case inc:
        return state + 1;
      case dec:
        return state - 1;
      default:
        return state;
    }
  });

  pf.dispatch(inc);
  t.equal(store.getState(), 1);

  pf.dispatch(inc);
  t.equal(store.getState(), 2);

  pf.dispatch(dec);
  t.equal(store.getState(), 1);

  pf.dispatch(dec);
  t.equal(store.getState(), 0);

  t.deepEqual(
    Object.keys(store).sort(),
    [
      "dispatch",
      "dispatchToken",
      "getReducer",
      "getState",
      "name",
      "replaceReducer",
      "setState",
      "subscribe"
    ].sort()
  );
});

test("CountStore", function(t) {
  // ensure store with non-object initialState handled correctly

  var MessageCountStore = createStore(
    "test2MessageCountStore",
    (count = 0, action) => {
      switch (action.type) {
        case "receiveMessage":
          return count + 1;
        default:
          return count;
      }
    }
  );

  t.plan(4);

  t.equals(MessageCountStore.getState(), 0);
  MessageCountStore.dispatch("receiveMessage", "Hello");
  t.equals(MessageCountStore.getState(), 1);
  MessageCountStore.dispatch("receiveMessage", "Hello");
  t.equals(MessageCountStore.getState(), 2);

  // Test the reducer independently
  let reducer = MessageCountStore.getReducer();
  t.equals(reducer(1, { type: "receiveMessage" }), 2);
});

test("ImmutableMapStoreWithObjectSpec", function(t) {
  t.plan(10);

  var dispatch = pf.dispatch,
    Immutable = require("immutable");

  process.env.NODE_ENV = "prod";

  // For when switch cases seem like overkill.
  var store = pf.createStore(
    "test3ImmutableMapStore",
    {
      getInitialState: () => Immutable.Map(),
      set: (state, data) => state.merge(data)
    },
    {
      get: (state, param) => state.get(param),
      has: (state, param) => state.has(param),
      includes: (state, param) => state.includes(param),
      first: state => state.first(),
      last: state => state.last(),
      all: state => state.toJS()
    }
  );

  // should only be when
  t.equal(typeof store.replaceState, "undefined");

  t.deepEqual(
    Object.keys(store).sort(),
    [
      "get",
      "has",
      "includes",
      "first",
      "last",
      "all",
      "dispatchToken",
      "subscribe",
      "name",
      "replaceReducer",
      "set",
      "setState",
      "dispatch",
      "getState",
      "getReducer"
    ].sort()
  );

  store.set({ states: ["CA", "OR", "WA"] });
  dispatch("set", { programs: [{ name: "A", states: ["CA"] }] });
  dispatch("set", { selectedState: "CA" });

  t.deepEqual(store.get("states").toJS(), ["CA", "OR", "WA"]);
  t.deepEqual(store.get("programs").toJS(), [{ name: "A", states: ["CA"] }]);
  t.deepEqual(store.get("selectedState"), "CA");
  t.deepEqual(store.all(), {
    states: ["CA", "OR", "WA"],
    programs: [{ name: "A", states: ["CA"] }],
    selectedState: "CA"
  });

  t.deepEqual(store.has("states"), true);
  t.deepEqual(store.first().toJS(), ["CA", "OR", "WA"]);
  t.deepEqual(store.last(), "CA");
  t.deepEqual(store.includes("CA"), true);
});

test("waitFor and events works correctly", function*(t) {
  var dispatchCount = 0,
    dispatchCount2 = 0;

  t.plan(18);

  var MessageStore = createStore("test4MessageStore", function(
    state = [],
    action
  ) {
    switch (action.type) {
      case "loadMessage":
        return state.concat(action.data);
      default:
        return state;
    }
  });

  var MessageCountStore = createStore("test4MessageCountStore", function(
    state = 0,
    action,
    waitFor
  ) {
    // ensure that MessageStore reducer is executed before continuing
    waitFor([MessageStore.dispatchToken]);
    switch (action.type) {
      case "loadMessage":
        return state + 1;
      default:
        return state;
    }
  });

  var unsubscribe = MessageStore.subscribe(function() {
    dispatchCount += 1;
  });

  var unsubscribe2 = MessageCountStore.subscribe(function() {
    dispatchCount2 += 1;
  });

  t.equals(typeof unsubscribe, "function");

  dispatch("loadMessage", "Test");
  t.equals(MessageStore.getState().length, 1);
  t.equals(MessageCountStore.getState(), 1);
  t.deepEqual(MessageStore.getState(), ["Test"]);
  t.equal(dispatchCount, 1);
  t.equal(dispatchCount2, 1);

  dispatch("foo", "Test");

  t.equal(dispatchCount, 1);
  t.equal(dispatchCount2, 1);

  unsubscribe2();

  dispatch("loadMessage", "Test2");
  t.equals(MessageStore.getState().length, 2);
  t.equals(MessageCountStore.getState(), 2);
  t.deepEqual(MessageStore.getState(), ["Test", "Test2"]);
  t.equal(dispatchCount, 2);
  t.equal(dispatchCount2, 1);

  unsubscribe();
  var result = yield dispatch(
    Promise.resolve({ type: "loadMessage", data: "Test3" })
  );

  t.equals(MessageStore.getState().length, 3);
  t.equals(MessageCountStore.getState(), 3);
  t.deepEqual(MessageStore.getState(), ["Test", "Test2", "Test3"]);

  t.equal(dispatchCount, 2);
  t.equal(dispatchCount2, 1);
});

test("check root store", function*(t) {
  t.plan(10);

  var count = 0;

  var rootListener = subscribe(() => count++);
  dispatch("no-action-here", "Test3");

  t.equal(count, 0);

  yield dispatch("no-handler-action-here", "Test3");
  yield dispatch("loadMessage", "Test3");

  t.equal(count, 1);

  let rootState;

  // try to modify/replace state
  var modifiedState = Object.assign({}, rootState);
  delete modifiedState.master;

  replaceState(modifiedState);

  rootState = getState();
  t.equal(Object.keys(rootState).length, Object.keys(modifiedState).length);

  yield dispatch("no-handler-action-here", "Test3");
  yield dispatch("no-handler-action-here", "Test3");
  yield dispatch("loadMessage", "Test3");
  t.equal(count, 3);
  yield dispatch("loadMessage", "Test3");
  t.equal(count, 4);
  yield dispatch("loadMessage", "Test3");
  t.equal(count, 5);

  var last;
  var subscribe3 = subscribe((state, action) => {
    last = { state, action };
  });

  yield dispatch("loadMessage", "Test3");

  t.equal(count, 6);

  t.deepEqual(last, {
    state: {
      test1CountStore: 0,
      test2MessageCountStore: 0,
      test4MessageStore: ["Test3", "Test3", "Test3", "Test3"],
      test4MessageCountStore: 4
    },
    action: { type: "loadMessage", data: "Test3" }
  });

  // verify that state and action are passed to listener
  t.equal(Object.keys(last.state).length, 4);
  t.equal(last.action.type, "loadMessage");
});
