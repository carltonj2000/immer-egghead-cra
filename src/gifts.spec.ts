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
  gifts: [
    {
      id: "immer_license",
      description: "Immer license",
      image:
        "https://raw.githubusercontent.com/immerjs/immer/master/images/immer-logo.png",
      reservedBy: 2,
    },
    {
      id: "egghead_subscription",
      description: "Egghead.io subscription",
      image:
        "https://pbs.twimg.com/profile_images/735242324293210112/H8YfgQHP_400x400.jpg",
      reservedBy: undefined,
    },
  ],
};

describe("Adding a gift", () => {
  const nextState = giftsReducer(initialState, {
    type: "ADD_GIFT",
    id: "mug",
    description: "coffee mug",
    image: "",
  });

  test("added a gift to teh collection", () => {
    expect(nextState.gifts.length).toBe(3);
  });

  test("didn't modify the original state", () => {
    expect(initialState.gifts.length).toBe(2);
  });
});

describe("reserving an unreserved gift", () => {
  const nextState = giftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    id: "egghead_subscription",
  });

  test("correctly stores reservedBy", () => {
    expect(nextState.gifts[1].reservedBy).toBe(1);
  });

  test("didn't modify the original state", () => {
    expect(initialState.gifts[1].reservedBy).toBe(undefined);
  });

  test("does structurally share unchanged part of the state tree", () => {
    expect(nextState).not.toBe(initialState);
    expect(nextState.gifts[1]).not.toBe(initialState.gifts[1]);
    expect(nextState.gifts[0]).toBe(initialState.gifts[0]);
  });

  test("can't accidentally modify the produced state", () => {
    expect(() => {
      nextState.gifts[1].reservedBy = undefined;
    }).toThrow();
  });
});

describe("reserving an already reserved gift", () => {
  const nextState = giftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    giftId: "immer_license",
  });

  test("preserves stored reservedBy", () => {
    expect(nextState.gifts[0].reservedBy).toBe(2);
  });

  test("no new gift should be created", () => {
    expect(initialState.gifts[0]).toEqual(nextState.gifts[0]);
    expect(initialState.gifts[0]).toBe(nextState.gifts[0]);
    expect(initialState).toBe(nextState);
  });
});

describe("can add a book async", () => {
  test("can add math book", async () => {
    const nextState = await giftsReducer(initialState, {
      type: "ADD_BOOK",
      book: await getBookDetails("0201558025"),
    });
    expect(nextState.gifts[2].description).toBe("Concrete mathematics");
  });

  test("can add two books in parallel", async () => {
    const promise1 = getBookDetails("0201558025");
    const promise2 = getBookDetails("9781598560169");
    const addBook1 = { type: "ADD_BOOK", book: await promise1 };
    const addBook2 = { type: "ADD_BOOK", book: await promise2 };
    const nextState = [addBook1, addBook2].reduce(giftsReducer, initialState);
    expect(nextState.gifts.length).toBe(4);
  });
});

describe("reserving an unreserved gift with patches", () => {
  const [nextState, patches] = patchGeneratingGiftsReducer(initialState, {
    type: "TOGGLE_RESERVATION",
    id: "egghead_subscription",
  });

  test("correctly stores reservedBy", () => {
    expect(nextState.gifts[1].reservedBy).toBe(1);
  });

  test("generates the correct patches", () => {
    expect(patches).toEqual([
      {
        op: "replace",
        path: ["gifts", 1, "reservedBy"],
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
