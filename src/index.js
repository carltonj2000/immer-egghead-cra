import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";

import "./misc/index.css";

import { addBook, addGift, getInitialState, toggleReservation } from "./gifts";

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

  const handleAdd = () => {
    const description = prompt("Gift to add");
    if (description) {
      stateSet((state) =>
        addGift(
          state,
          uuidv4(),
          description,
          `https://picsum.photos/id/${Math.round(Math.random() * 1000)}/200/200`
        )
      );
    }
  };

  const handleReserve = React.useCallback(
    (id) => {
      stateSet((state) => toggleReservation(state, id));
    },
    [stateSet]
  );

  const handleReset = () => stateSet(getInitialState());

  const handleAddBook = async () => {
    const isbn = prompt("Enter ISBN number", "0201558025");
    if (isbn) {
      const newState = await addBook(state, isbn);
      stateSet(newState);
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
        {gifts.map((gift) => (
          <Gift
            key={gift.id}
            {...{ gift, users, currentUser }}
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
