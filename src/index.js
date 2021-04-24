import React from "react";
import ReactDOM from "react-dom";
import { v4 as uuidv4 } from "uuid";
import { useImmer } from "use-immer";

import "./misc/index.css";

import { getInitialState } from "./gifts";

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
  const [state, stateUpdate] = useImmer(() => getInitialState());
  const { users, gifts, currentUser } = state;

  const handleAdd = () => {
    const description = prompt("Gift to add");
    if (description) {
      stateUpdate(
        (draft) =>
          void draft.gifts.push({
            id: uuidv4(),
            description,
            image: `https://picsum.photos/id/${Math.round(
              Math.random() * 1000
            )}/200/200`,
            reservedBy: undefined,
          })
      );
    }
  };

  const handleReserve = React.useCallback(
    (id) => {
      stateUpdate((draft) => {
        const gift = draft.gifts.find((gift) => gift.id === id);
        gift.reservedBy =
          gift.reservedBy === undefined
            ? draft.currentUser.id
            : gift.reservedBy === draft.currentUser.id
            ? undefined
            : gift.reservedBy;
      });
    },
    [stateUpdate]
  );

  const handleReset = () => {
    stateUpdate((draft) => {
      return getInitialState();
    });
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Hi, {currentUser.name}</h1>
      </div>
      <div className="actions">
        <button onClick={handleAdd}>Add</button>
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
