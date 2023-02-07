import { configureStore } from "@reduxjs/toolkit";
import { createProductFilter } from "../entities/ProductFilter";

let initialState = {
    catalogFilter: createProductFilter(),
};

export const store = configureStore({
    reducer: (state, action) => {
        switch (action.type) {
            case "filter/update":
                return { ...state, catalogFilter: action.payload };
            default:
                return state;
        }
    },
    preloadedState: initialState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
