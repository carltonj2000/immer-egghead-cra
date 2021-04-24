import produce from "immer";

export const addGift = (state, id, description, image) => {
  return produce(state, (draft) => {
    draft.gifts.push({ id, description, image, reservedBy: undefined });
  });
};

export const toggleReservation = (state, giftId) => {
  return produce(state, (draft) => {
    const gift = draft.gifts.find((gift) => gift.id === giftId);
    gift.reservedBy =
      gift.reservedBy === undefined
        ? draft.currentUser.id
        : gift.reservedBy === draft.currentUser.id
        ? undefined
        : gift.reservedBy;
    return draft;
  });
};
