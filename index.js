#!/usr/bin/env node
//hide GUN log messages
var process = require("process");
process.env.GUN_ENV = "production"; //hide log messages

var createActions = require("redux-p2p-middleware").default;
var GunTransport = require("redux-p2p-gundb-transport/node");
var { createStore, applyMiddleware } = require("redux");
var blessed = require("blessed");

//test gun server
var transport = new GunTransport(
    "https://redux-replication-server.herokuapp.com/gun"
);
//Create the rplication middle ware
var replicator = createActions(["ADD_MESSAGE"], transport);
//Create the redux store
var store = createStore(reducer, applyMiddleware(replicator));

var initialState = {
    messages: []
};

function reducer(state = initialState, action) {
    switch (action.type) {
        case "ADD_MESSAGE":
            let sortedMessages = [
                ...state.messages,
                {
                    message: action.message.substring(0, 140),
                    created: action.created
                }
            ];
            sortedMessages.sort((a, b) => {
                return a.created > b.created ? 1 : -1;
            });
            return Object.assign(
                {},
                {
                    state,
                    messages: sortedMessages
                }
            );
        default:
            return state;
    }
}

store.subscribe(() => {
    var state = store.getState();
    box.setContent(state.messages.map(m => m.message).join("\n"));
    box.setScrollPerc(100);
    screen.render();
});

// ------ UI stuff ------ //

var screen = blessed.screen({
    smartCSR: true
});

screen.title = "redux-p2p node demo";
// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
    top: "center",
    left: "center",
    width: "80%",
    height: "80%",
    content: "",
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: " ",
        inverse: true
    },
    tags: true,
    border: {
        type: "line"
    },
    style: {
        fg: "#2e3029",
        bg: "#bed8d1",
        border: {
            fg: "#f0f0f0"
        },
        hover: {
            bg: "green"
        }
    }
});

var input = blessed.textbox({
    top: "82%",
    left: "center",
    width: "80%",
    height: "20%",
    content: "",
    tags: true,
    inputOnFocus: true,
    border: {
        type: "line"
    },
    style: {
        fg: "black",
        bg: "white",
        border: {
            fg: "#f0f0f0"
        },
        hover: {
            bg: "green"
        }
    }
});

screen.append(box);
screen.append(input);

//Add the message to the store
input.on("submit", val => {
    if (val === "/exit") {
        return process.exit(0);
    }
    store.dispatch({
        type: "ADD_MESSAGE",
        message: val,
        created: new Date()
    });
    input.setValue("");
    input.focus();
    screen.render();
});

// Quit on Escape, q, or Control-C.
screen.key(["escape", "q", "C-c"], function(ch, key) {
    return process.exit(0);
});

console.clear();
screen.render();


