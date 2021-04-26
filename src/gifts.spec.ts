import {
  getBookDetails,
  giftsReducer,
  patchGeneratingGiftsReducer,
  State,
  applyPatches,
} from "./gifts";

const initialState: State = {
  users: [
    {
      id: 1,
      name: "Test user",
    },
    {
      id: 2,
      name: "Someone else",
    },
  ],
  currentUser: {
    id: 1,
    name: "Test user",
  },
  gifts: {
    immer_license: {
      id: "immer_license",
      description: "Immer license",
      image:
        "https://raw.githubusercontent.com/immerjs/immer/master/images/immer-logo.png",
      reservedBy: 2,
    },
    egghead_subscription: {
      id: "egghead_subscription",
      description: "Egghead.io subscription",
      image:
        "https://pbs.twimg.com/profile_images/735242324293210112/H8YfgQHP_400x400.jpg",
      reservedBy: undefined,
    },
  },
};

describe("Adding a gift", () => {
  const nextState = giftsReducer(initialState, {
    type: "ADD_GIFT",
    id: "mug",
    description: "coffee mug",
    image: "",
  });

  test("added a gift to the collection", () => {
    expect(Object.keys(nextState.gifts).length).toBe(3);
  });

  test("didn't modify the original state", () => {
    expect(Object.keys(initialState.gifts).length).toBe(2);
  });
});

describe("reserving an unreserved gift", () => {
  const id = "egghead_subscription";
  const id0 = "immer_license";
  const nextState = giftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    id,
  });

  test("correctly stores reservedBy", () => {
    expect(nextState.gifts[id].reservedBy).toBe(1);
  });

  test("didn't modify the original state", () => {
    expect(initialState.gifts[id].reservedBy).toBe(undefined);
  });

  test("does structurally share unchanged part of the state tree", () => {
    expect(nextState).not.toBe(initialState);
    expect(nextState.gifts[id]).not.toBe(initialState.gifts[id]);
    expect(nextState.gifts[id0]).toBe(initialState.gifts[id0]);
  });

  test("can't accidentally modify the produced state", () => {
    expect(() => {
      nextState.gifts[id].reservedBy = undefined;
    }).toThrow();
  });
});

describe("reserving an already reserved gift", () => {
  const id = "immer_license";
  const nextState = giftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    id,
  });

  test("preserves stored reservedBy", () => {
    expect(nextState.gifts[id].reservedBy).toBe(2);
  });

  test("no new gift should be created", () => {
    expect(initialState.gifts[id]).toEqual(nextState.gifts[id]);
    expect(initialState.gifts[id]).toBe(nextState.gifts[id]);
    expect(initialState).toBe(nextState);
  });
});

describe("can add a book async", () => {
  const id = "0201558025";
  test("can add math book", async () => {
    const nextState = await giftsReducer(initialState, {
      type: "ADD_BOOK",
      book: await getBookDetails(id),
    });
    expect(nextState.gifts[id].description).toBe("Concrete mathematics");
  });

  test("can add two books in parallel", async () => {
    const promise1 = getBookDetails("0201558025");
    const promise2 = getBookDetails("9781598560169");
    const addBook1 = { type: "ADD_BOOK", book: await promise1 };
    const addBook2 = { type: "ADD_BOOK", book: await promise2 };
    const nextState = [addBook1, addBook2].reduce(giftsReducer, initialState);
    expect(Object.keys(nextState.gifts).length).toBe(4);
  });
});

describe("reserving an unreserved gift with patches", () => {
  const id = "egghead_subscription";
  const [nextState, patches] = patchGeneratingGiftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    id,
  });

  test("correctly stores reservedBy", () => {
    expect(nextState.gifts[id].reservedBy).toBe(1);
  });

  test("generates the correct patches", () => {
    expect(patches).toEqual([
      {
        op: "replace",
        path: ["gifts", id, "reservedBy"],
        value: 1,
      },
    ]);
  });

  test("replaying patches produces the same state - 1", () => {
    expect(applyPatches(initialState, patches)).toEqual(nextState);
  });

  test("replaying patches produces the same state - 2", () => {
    expect(
      giftsReducer(initialState, { type: "APPLY_PATCHES", patches })
    ).toEqual(nextState);
  });
});
