import { configureStore } from "@reduxjs/toolkit";
import ProductFilter from "../entities/ProductFilter";

let initialState = {
    catalogFilter: new ProductFilter(),
};

export const store = configureStore({
    reducer: (state, action) => {
        switch (action.type) {
            default:
                return state;
        }
    },
    preloadedState: initialState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
