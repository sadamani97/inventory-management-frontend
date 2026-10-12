import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPaginatedPurchaseOrders,
  fetchPurchaseOrderStats,
  PurchaseOrderItem,
  PurchaseOrderStatsResponse,
} from "@/lib/dashboardApi";
import type { RootState } from "./index";

interface PurchaseOrderState {
  orders: PurchaseOrderItem[];
  totalOrders: number;
  stats: PurchaseOrderStatsResponse | null;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: string;
  loading: boolean;
}

const initialState: PurchaseOrderState = {
  orders: [],
  totalOrders: 0,
  stats: null,
  currentPage: 1,
  pageSize: 10,
  searchQuery: "",
  statusFilter: "All Status",
  loading: true,
};

export const fetchPurchaseOrdersThunk = createAsyncThunk(
  "purchaseOrders/fetchList",
  async (_, { getState }) => {
    const state = (getState() as RootState).purchaseOrders;
    const response = await fetchPaginatedPurchaseOrders({
      page: state.currentPage,
      limit: state.pageSize,
      search: state.searchQuery.trim() || undefined,
      status: state.statusFilter !== "All Status" ? state.statusFilter : undefined,
    });
    return response;
  }
);

export const fetchPurchaseOrderStatsThunk = createAsyncThunk(
  "purchaseOrders/fetchStats",
  async () => {
    const stats = await fetchPurchaseOrderStats();
    return stats;
  }
);

const purchaseOrderSlice = createSlice({
  name: "purchaseOrders",
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setOrders(state, action: PayloadAction<PurchaseOrderItem[]>) {
      state.orders = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrdersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.totalOrders = action.payload.totalItems;
      })
      .addCase(fetchPurchaseOrdersThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchPurchaseOrderStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  setCurrentPage,
  setPageSize,
  setSearchQuery,
  setStatusFilter,
  setOrders,
  setLoading,
} = purchaseOrderSlice.actions;

export default purchaseOrderSlice.reducer;
