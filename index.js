var createActions = require("redux-p2p-middleware").default;
var GunTransport = require("redux-p2p-gundb-transport/node");
var { createStore, applyMiddleware } = require("redux");
var prompt = require("prompt");
var console = require("better-console");
var term = require("terminal-kit").terminal;
//test gun server
var transport = new GunTransport(
    "https://redux-replication-server.herokuapp.com/gun"
);
var replicator = createActions(["ADD_MESSAGE"], transport);
var store = createStore(reducer, applyMiddleware(replicator));

var initialState = {
    messages: []
};

function reducer(state = initialState, action) {
    switch (action.type) {
        case "ADD_MESSAGE":
            return Object.assign(
                {},
                {
                    state,
                    messages: [
                        ...state.messages,
                        action.message.substring(0, 140)
                    ]
                }
            );
        default:
            return state;
    }
}

store.subscribe(() => {
    console.clear();
    var state = store.getState();
    term(state.messages.join("\n"));
});

function loop() {
    term.magenta('\nMessage:')
    term.inputField((err, result) => {
        if (err || result == null) return;

        store.dispatch({
            type: "ADD_MESSAGE",
          message: result
        });
        loop();
    });
}

function terminate() {
    term.grabInput(false);
    setTimeout(function() {
        process.exit();
    }, 100);
}

term.on("key", function(name, matches, data) {
    if (name === "CTRL_C") {
        terminate();
    }
});

console.clear();

loop();
