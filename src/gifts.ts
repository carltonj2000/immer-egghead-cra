import produce, { Draft, produceWithPatches, enablePatches } from "immer";
import { allUsers, getCurrentUser } from "./misc/users";
import defaultGifts from "./misc/gifts.json";

enablePatches();

interface Gift {
  readonly id: string;
  readonly description: string;
  readonly image: string;
  readonly reservedBy?: number;
}

interface User {
  readonly id: number;
  readonly name: string;
}

export interface State {
  readonly users: readonly User[];
  readonly currentUser: User;
  readonly gifts: readonly Gift[];
}

interface Book {
  readonly isbn: string;
  readonly title: string;
  readonly identifiers: {
    readonly isbn_10: string[];
  };
  readonly cover: {
    readonly medium: string;
  };
}

type Action =
  | { type: "ADD_GIFT"; id: string; description: string; image: string }
  | { type: "TOGGLE_RESERVATION"; id: string }
  | { type: "ADD_BOOK"; book: Book }
  | { type: "RESET" };

const giftsRecipe = (
  draft: Draft<State>,
  action: Action
): State | undefined => {
  switch (action.type) {
    case "ADD_GIFT":
      const { id, description, image } = action;
      draft.gifts.push({ id, description, image, reservedBy: undefined });
      break;
    case "TOGGLE_RESERVATION": {
      const { id } = action;
      const gift = draft.gifts.find((gift) => gift.id === id);
      if (!gift) return;
      gift.reservedBy =
        gift.reservedBy === undefined
          ? draft.currentUser.id
          : //: gift.reservedBy === original(draft.currentUser).id
          gift.reservedBy === draft.currentUser.id
          ? undefined
          : gift.reservedBy;
      break;
    }
    case "ADD_BOOK":
      const { book } = action;
      draft.gifts.push({
        id: book.identifiers.isbn_10[0],
        description: book.title,
        image: book.cover.medium,
        reservedBy: undefined,
      });
      break;
    case "RESET":
      return getInitialState();
  }
};
export const giftsReducer = produce(giftsRecipe);

export const patchGeneratingGiftsReducer = produceWithPatches(giftsRecipe);

export const getInitialState = (): State => ({
  users: allUsers,
  currentUser: getCurrentUser(),
  gifts: defaultGifts,
});

export const getBookDetails = async (isbn: string): Promise<Book> => {
  const response = await fetch(
    `http://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
    {
      mode: "cors",
    }
  );
  return (await response.json())["ISBN:" + isbn];
};
