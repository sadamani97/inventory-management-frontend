import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import vendorReducer from "./vendorSlice";
import salesOrderReducer from "./salesOrderSlice";
import purchaseOrderReducer from "./purchaseOrderSlice";
import productReducer from "./productSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendor: vendorReducer,
    salesOrders: salesOrderReducer,
    purchaseOrders: purchaseOrderReducer,
    products: productReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
