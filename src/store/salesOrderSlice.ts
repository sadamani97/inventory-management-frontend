import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPaginatedSalesOrders,
  fetchSalesOrderStats,
  SalesOrderItem,
  SalesOrderStatsResponse,
} from "@/lib/dashboardApi";
import type { RootState } from "./index";

interface SalesOrderState {
  orders: SalesOrderItem[];
  totalOrders: number;
  stats: SalesOrderStatsResponse | null;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: string;
  loading: boolean;
}

const initialState: SalesOrderState = {
  orders: [],
  totalOrders: 0,
  stats: null,
  currentPage: 1,
  pageSize: 10,
  searchQuery: "",
  statusFilter: "All Status",
  loading: true,
};

export const fetchSalesOrdersThunk = createAsyncThunk(
  "salesOrders/fetchList",
  async (_, { getState }) => {
    const state = (getState() as RootState).salesOrders;
    const response = await fetchPaginatedSalesOrders({
      page: state.currentPage,
      limit: state.pageSize,
      search: state.searchQuery.trim() || undefined,
      status: state.statusFilter !== "All Status" ? state.statusFilter : undefined,
    });
    return response;
  }
);

export const fetchSalesOrderStatsThunk = createAsyncThunk(
  "salesOrders/fetchStats",
  async () => {
    const stats = await fetchSalesOrderStats();
    return stats;
  }
);

const salesOrderSlice = createSlice({
  name: "salesOrders",
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.currentPage = 1; // reset to first page when page size changes
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.currentPage = 1; // reset to first page on search
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.currentPage = 1; // reset to first page on filter
    },
    setOrders(state, action: PayloadAction<SalesOrderItem[]>) {
      state.orders = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrdersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSalesOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.totalOrders = action.payload.totalItems;
      })
      .addCase(fetchSalesOrdersThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchSalesOrderStatsThunk.fulfilled, (state, action) => {
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
} = salesOrderSlice.actions;

export default salesOrderSlice.reducer;
