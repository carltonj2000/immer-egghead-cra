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
  const { users, gifts, currentUser } = state;

  const send = useSocket("ws://localhost:5001", (patches) => {
    stateSet((state) =>
      giftsReducer(state, { type: "APPLY_PATCHES", patches })
    );
  });

  const dispatch = React.useCallback(
    (action) => {
      stateSet((currentState) => {
        const [nextState, patches] = patchGeneratingGiftsReducer(
          currentState,
          action
        );
        /*
        let patchesOut = patches;
        if (patches[0].value.currentUser) {
          const { gifts, users } = patches[0].value;
          patchesOut = [{ ...patches[0], value: { users, gifts } }];
        }
        console.log({ patchesOut, patches });
        send(patchesOut);*/
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

  return (
    <div className="app">
      <div className="header">
        <h1>Hi, {currentUser.name}</h1>
      </div>
      <div className="actions">
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleAddBook}>Add Book</button>
        <button onClick={handleReset}>Reset</button>
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
