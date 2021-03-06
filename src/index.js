import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";

import "./misc/index.css";

import {
  getBookDetails,
  getInitialState,
  giftsReducer,
  patchGeneratingGiftsReducer,
} from "./gifts";
import { useSocket } from "./misc/useSocket";

const Gift = React.memo(({ gift, users, currentUser, onReserve }) => {
  return (
    <div className={`gift ${gift.reservedBy ? "reserved" : ""}`}>
      <img src={gift.image} alt={gift.description} />
      <div className="description">
        <h2>{gift.description}</h2>
      </div>
      <div className="reservation">
        {!gift.reservedBy ? (
          <button onClick={() => onReserve(gift.id)}>Reserve</button>
        ) : gift.reservedBy === currentUser.id ? (
          <button onClick={() => onReserve(gift.id)}>Unreserve</button>
        ) : (
          <span>{users[gift.reservedBy].name}</span>
        )}
      </div>
    </div>
  );
});

const GiftList = () => {
  const [state, stateSet] = React.useState(getInitialState());
  const undoStack = React.useRef([]);
  const undoStackPointer = React.useRef(-1);

  const { users, gifts, currentUser } = state;

  const send = useSocket("ws://localhost:5001", (patches) => {
    stateSet((state) =>
      giftsReducer(state, { type: "APPLY_PATCHES", patches })
    );
  });

  const dispatch = React.useCallback(
    (action, undoable = true) => {
      stateSet((currentState) => {
        const [
          nextState,
          patches,
          inversePatches,
        ] = patchGeneratingGiftsReducer(currentState, action);
        /*
        let patchesOut = patches;
        if (patches[0].value.currentUser) {
          const { gifts, users } = patches[0].value;
          patchesOut = [{ ...patches[0], value: { users, gifts } }];
        }
        console.log({ patchesOut, patches });
        send(patchesOut);*/
        if (undoable) {
          const pointer = ++undoStackPointer.current;
          undoStack.current.length = pointer;
          undoStack.current[pointer] = { patches, inversePatches };
        }
        send(patches);
        return nextState;
      });
    },
    [send]
  );

  const handleAdd = () => {
    const description = prompt("Gift to add");
    if (description) {
      dispatch({
        type: "ADD_GIFT",
        id: uuidv4(),
        description,
        image: `https://picsum.photos/id/${Math.round(
          Math.random() * 1000
        )}/200/200`,
      });
    }
  };

  const handleReserve = React.useCallback(
    (id) => dispatch({ type: "TOGGLE_RESERVATION", id }),
    [dispatch]
  );

  const handleReset = () => dispatch({ type: "RESET" });

  const handleAddBook = async () => {
    const isbn = prompt("Enter ISBN number", "0201558025");
    if (isbn) {
      const book = await getBookDetails(isbn);
      dispatch({ type: "ADD_BOOK", book });
    }
  };

  const handleUndo = () => {
    if (!undoStackPointer.current < 0) return;
    const patches = undoStack.current[undoStackPointer.current].inversePatches;
    undoStackPointer.current--;
    dispatch({ type: "APPLY_PATCHES", patches }, false);
  };

  const handleRedo = () => {
    if (!undoStackPointer.current === undoStack.current.length - 1) return;
    undoStackPointer.current++;
    const patches = undoStack.current[undoStackPointer.current].patches;
    dispatch({ type: "APPLY_PATCHES", patches }, false);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Hi, {currentUser.name}</h1>
      </div>
      <div className="actions">
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleAddBook}>Add Book</button>
        <button onClick={handleReset}>Reset</button>
        <button onClick={handleUndo} disabled={undoStackPointer.current < 0}>
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={undoStackPointer.current === undoStack.current.length - 1}
        >
          Redo
        </button>
      </div>
      <div className="gifts">
        {Object.keys(gifts).map((id) => (
          <Gift
            key={id}
            {...{ gift: gifts[id], users, currentUser }}
            onReserve={handleReserve}
          />
        ))}
      </div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <GiftList />
  </React.StrictMode>,
  document.getElementById("root")
);
