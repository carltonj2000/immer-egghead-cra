import produce, { Draft } from "immer";
//import produce, { original, createDraft, finishDraft } from "immer";
import { allUsers, getCurrentUser } from "./misc/users";
import defaultGifts from "./misc/gifts.json";

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

interface State {
  readonly user: readonly User[];
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

export const addGift = produce(
  (draft: Draft<State>, id: string, description: string, image: string) => {
    draft.gifts.push({ id, description, image, reservedBy: undefined });
  }
);

export const toggleReservation = produce(
  (draft: Draft<State>, giftId: string) => {
    const gift = draft.gifts.find((gift) => gift.id === giftId);
    if (!gift) return;
    gift.reservedBy =
      gift.reservedBy === undefined
        ? draft.currentUser.id
        : //: gift.reservedBy === original(draft.currentUser).id
        gift.reservedBy === draft.currentUser.id
        ? undefined
        : gift.reservedBy;
  }
);

export const getInitialState = () => ({
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

export const addBook = produce(async (draft: Draft<State>, book: Book) => {
  draft.gifts.push({
    id: book.isbn,
    description: book.title,
    image: book.cover.medium,
    reservedBy: undefined,
  });
});

/*
export const addBook = produce(async (draft, isbn) => {
  //  const draft = createDraft(state);
  const response = await fetch(
    `http://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`,
    {
      mode: "cors",
    }
  );
  const book = (await response.json())["ISBN:" + isbn];
  draft.gifts.push({
    id: isbn,
    description: book.title,
    image: book.cover.medium,
    reservedBy: undefined,
  });
  //  return finishDraft(draft);
});
*/
