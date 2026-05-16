import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    books: (state = {}) => state, // Reducer initial pour valider le store
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
