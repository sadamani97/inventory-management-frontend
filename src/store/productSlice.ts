import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchPaginatedProducts,
  fetchProductStats,
  ProductItem,
  ProductStatsResponse,
} from "@/lib/dashboardApi";
import type { RootState } from "./index";

interface ProductState {
  products: ProductItem[];
  totalProducts: number;
  stats: ProductStatsResponse | null;
  currentPage: number;
  pageSize: number;
  search: string;
  categoryFilter: string;
  loading: boolean;
}

const initialState: ProductState = {
  products: [],
  totalProducts: 0,
  stats: null,
  currentPage: 1,
  pageSize: 10,
  search: "",
  categoryFilter: "All Category",
  loading: true,
};

export const fetchProductsThunk = createAsyncThunk(
  "products/fetchList",
  async (_, { getState }) => {
    const state = (getState() as RootState).products;
    const response = await fetchPaginatedProducts({
      page: state.currentPage,
      limit: state.pageSize,
      search: state.search.trim() || undefined,
      categoryName: state.categoryFilter !== "All Category" ? state.categoryFilter : undefined,
    });
    return response;
  }
);

export const fetchProductStatsThunk = createAsyncThunk(
  "products/fetchStats",
  async () => {
    const stats = await fetchProductStats();
    return stats;
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.currentPage = 1;
    },
    setCategoryFilter(state, action: PayloadAction<string>) {
      state.categoryFilter = action.payload;
      state.currentPage = 1;
    },
    setProducts(state, action: PayloadAction<ProductItem[]>) {
      state.products = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.totalProducts = action.payload.totalItems;
      })
      .addCase(fetchProductsThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchProductStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const {
  setCurrentPage,
  setPageSize,
  setSearch,
  setCategoryFilter,
  setProducts,
  setLoading,
} = productSlice.actions;

export default productSlice.reducer;
