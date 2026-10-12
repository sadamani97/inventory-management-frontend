import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  VendorItem,
  VendorStatsResponse,
  VendorTypeItem,
  CountryItem,
  StateItem,
  CityItem,
  CategoryItem,
  fetchPaginatedVendors,
} from "@/lib/dashboardApi";
import type { RootState } from "./index";

interface VendorFormState {
  vendorName: string;
  companyName: string;
  vendorTypeId: string;
  website: string;
  gstin: string;
  status: "active" | "inactive";
  vendorCode: string;
  panNumber: string;
  currency: string;
  creditLimit: string;
  productCategory: string;
  preferredProducts: string;
  leadTime: string;
  gstCertificate: string;
  agreement: string;
  vendorLogo: string;
  phoneCode: string;
  vendorPhone: string;
  vendorEmail: string;

  addressId: number | string | null;
  addressLine: string;
  countryName: string;
  stateName: string;
  cityName: string;
  pincode: string;

  contactId: number | string | null;
  contactName: string;
  contactEmail: string;
  contactMobile: string;

  bankDetailId: number | string | null;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
}

const initialFormState: VendorFormState = {
  vendorName: "",
  companyName: "",
  vendorTypeId: "",
  website: "",
  gstin: "",
  status: "active",
  vendorCode: "",
  panNumber: "",
  currency: "INR (₹)",
  creditLimit: "",
  productCategory: "",
  preferredProducts: "",
  leadTime: "",
  gstCertificate: "",
  agreement: "",
  vendorLogo: "",
  phoneCode: "+91",
  vendorPhone: "",
  vendorEmail: "",

  addressId: null,
  addressLine: "",
  countryName: "",
  stateName: "",
  cityName: "",
  pincode: "",

  contactId: null,
  contactName: "",
  contactEmail: "",
  contactMobile: "",

  bankDetailId: null,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  upiId: "",
};

interface VendorState {
  // Data
  vendors: VendorItem[];
  totalVendorsCount: number;
  stats: VendorStatsResponse;
  vendorTypes: VendorTypeItem[];
  countries: CountryItem[];
  states: StateItem[];
  cities: CityItem[];
  categories: CategoryItem[];
  loading: boolean;
  submitting: boolean;

  // Filters
  search: string;
  statusFilter: string;
  categoryFilter: string;
  lastDeliveryFilter: string;
  starredOnly: boolean;

  // Pagination
  currentPage: number;
  pageSize: number;

  // UI
  activeActionMenuId: number | string | null;
  showVendorModal: boolean;
  editingVendorId: number | string | null;
  deleteDialog: {
    isOpen: boolean;
    vendorId: number | string | null;
  };
  starLoadingIds: (number | string)[];

  // Form
  form: VendorFormState;
}

const initialState: VendorState = {
  vendors: [],
  totalVendorsCount: 0,
  stats: {
    totalVendors: 0,
    activeVendors: 0,
    newVendors: 0,
    activePurchaseOrders: 0,
  },
  vendorTypes: [],
  countries: [],
  states: [],
  cities: [],
  categories: [],
  loading: true,
  submitting: false,

  search: "",
  statusFilter: "All",
  categoryFilter: "All",
  lastDeliveryFilter: "All",
  starredOnly: false,

  currentPage: 1,
  pageSize: 10,

  activeActionMenuId: null,
  showVendorModal: false,
  editingVendorId: null,
  deleteDialog: {
    isOpen: false,
    vendorId: null,
  },
  starLoadingIds: [],

  form: initialFormState,
};

const vendorSlice = createSlice({
  name: "vendor",
  initialState,
  reducers: {
    // Data Actions
    setVendors(state, action: PayloadAction<VendorItem[]>) {
      state.vendors = action.payload;
    },
    setStats(state, action: PayloadAction<VendorStatsResponse>) {
      state.stats = action.payload;
    },
    setVendorTypes(state, action: PayloadAction<VendorTypeItem[]>) {
      state.vendorTypes = action.payload;
    },
    setCountries(state, action: PayloadAction<CountryItem[]>) {
      state.countries = action.payload;
    },
    setStates(state, action: PayloadAction<StateItem[]>) {
      state.states = action.payload;
    },
    setCities(state, action: PayloadAction<CityItem[]>) {
      state.cities = action.payload;
    },
    setCategories(state, action: PayloadAction<CategoryItem[]>) {
      state.categories = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSubmitting(state, action: PayloadAction<boolean>) {
      state.submitting = action.payload;
    },
    
    // Filters Actions
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
    },
    setCategoryFilter(state, action: PayloadAction<string>) {
      state.categoryFilter = action.payload;
    },
    setLastDeliveryFilter(state, action: PayloadAction<string>) {
      state.lastDeliveryFilter = action.payload;
    },
    setStarredOnly(state, action: PayloadAction<boolean>) {
      state.starredOnly = action.payload;
    },

    // Pagination Actions
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
    },

    // UI Actions
    setActiveActionMenuId(state, action: PayloadAction<number | string | null>) {
      state.activeActionMenuId = action.payload;
    },
    setShowVendorModal(state, action: PayloadAction<boolean>) {
      state.showVendorModal = action.payload;
    },
    setEditingVendorId(state, action: PayloadAction<number | string | null>) {
      state.editingVendorId = action.payload;
    },
    openDeleteDialog(state, action: PayloadAction<number | string>) {
      state.deleteDialog = { isOpen: true, vendorId: action.payload };
    },
    closeDeleteDialog(state) {
      state.deleteDialog = { isOpen: false, vendorId: null };
    },
    addStarLoadingId(state, action: PayloadAction<number | string>) {
      if (!state.starLoadingIds.includes(action.payload)) {
        state.starLoadingIds.push(action.payload);
      }
    },
    removeStarLoadingId(state, action: PayloadAction<number | string>) {
      state.starLoadingIds = state.starLoadingIds.filter((id) => id !== action.payload);
    },

    // Form Actions
    updateFormField(
      state,
      action: PayloadAction<{ field: keyof VendorFormState; value: string | number | null }>
    ) {
      const { field, value } = action.payload;
      (state.form as Record<keyof VendorFormState, string | number | null>)[field] = value;
    },
    resetForm(state) {
      state.form = initialFormState;
    },
    setForm(state, action: PayloadAction<Partial<VendorFormState>>) {
      state.form = { ...state.form, ...action.payload };
    },
    setTotalVendorsCount(state, action: PayloadAction<number>) {
      state.totalVendorsCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVendorsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload.data;
        state.totalVendorsCount = action.payload.totalItems;
      })
      .addCase(fetchVendorsThunk.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const fetchVendorsThunk = createAsyncThunk(
  "vendor/fetchList",
  async (_, { getState }) => {
    const state = (getState() as RootState).vendor;
    const response = await fetchPaginatedVendors({
      page: state.currentPage,
      limit: state.pageSize,
      search: state.search.trim() || undefined,
      status: state.statusFilter !== "All" ? state.statusFilter : undefined,
      category: state.categoryFilter !== "All" ? state.categoryFilter : undefined,
      starredOnly: state.starredOnly || undefined,
    });
    return response;
  }
);

export const {
  setVendors,
  setStats,
  setVendorTypes,
  setCountries,
  setStates,
  setCities,
  setCategories,
  setLoading,
  setSubmitting,
  setSearch,
  setStatusFilter,
  setCategoryFilter,
  setLastDeliveryFilter,
  setStarredOnly,
  setCurrentPage,
  setPageSize,
  setActiveActionMenuId,
  setShowVendorModal,
  setEditingVendorId,
  openDeleteDialog,
  closeDeleteDialog,
  addStarLoadingId,
  removeStarLoadingId,
  updateFormField,
  resetForm,
  setForm,
  setTotalVendorsCount,
} = vendorSlice.actions;

export default vendorSlice.reducer;
