import produce, { original } from "immer";
import { allUsers, getCurrentUser } from "./misc/users";
import defaultGifts from "./misc/gifts.json";

export const addGift = produce((draft, id, description, image) => {
  draft.gifts.push({ id, description, image, reservedBy: undefined });
});

export const toggleReservation = produce((draft, giftId) => {
  const gift = draft.gifts.find((gift) => gift.id === giftId);
  gift.reservedBy =
    gift.reservedBy === undefined
      ? draft.currentUser.id
      : gift.reservedBy === original(draft.currentUser).id
      ? undefined
      : gift.reservedBy;
});

export const getInitialState = () => ({
  users: allUsers,
  currentUser: getCurrentUser(),
  gifts: defaultGifts,
});
