import React, { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  setVendors, setStats, setVendorTypes, setCountries, setStates, setCities, setCategories,
  setLoading, setSubmitting, setSearch, setStatusFilter, setCategoryFilter, setLastDeliveryFilter,
  setStarredOnly, setActiveActionMenuId, setShowVendorModal, setEditingVendorId,
  setCurrentPage, setPageSize,
  openDeleteDialog, closeDeleteDialog,
  addStarLoadingId, removeStarLoadingId, updateFormField, resetForm, setForm
} from "@/store/vendorSlice";

import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExportDialog from "@/components/ui/ExportDialog";
import { useState } from "react";
import {
  fetchVendorsList,
  fetchVendorStats,
  createVendor,
  updateVendor,
  deleteVendor,
  fetchVendorTypes,
  fetchCountries,
  fetchStates,
  fetchCities,
  createAddress,
  updateAddress,
  createVendorContact,
  updateVendorContact,
  createVendorBankDetails,
  updateVendorBankDetails,
  fetchCategories,
  createCategory,
  setVendorStarred,
  VendorItem,
  CategoryItem,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/vendors.module.css";
import {
  FiSearch,
  FiPlus,
  FiUpload,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiX,
  FiStar,
  FiUserPlus,
  FiPaperclip,
} from "react-icons/fi";
import { toast } from "react-toastify";

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return `1 day ago`;
  if (diffInDays < 30) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};

export default function VendorsPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    vendors, stats, vendorTypes, countries, states, cities, categories, loading, submitting,
    search, statusFilter, categoryFilter, lastDeliveryFilter, starredOnly,
    currentPage, pageSize,
    activeActionMenuId, showVendorModal, editingVendorId, starLoadingIds: starLoadingIdsArr,
    deleteDialog,
    form
  } = useSelector((state: RootState) => state.vendor);
  
  const starLoadingIds = new Set(starLoadingIdsArr);

  const {
    vendorName, companyName, vendorTypeId, website, gstin, status, vendorCode, panNumber, currency, creditLimit, productCategory, preferredProducts, leadTime, gstCertificate, agreement, vendorLogo, phoneCode, vendorPhone, vendorEmail,
    addressLine, countryName, stateName, cityName, pincode,
    contactName, contactEmail, contactMobile,
    accountHolderName, bankName, accountNumber, ifscCode, branchName, upiId,
    addressId, contactId, bankDetailId
  } = form;

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Initial Load Data function
  const loadPageData = useCallback(async () => {
    dispatch(setLoading(true));
    const [vList, vStats, vTypes, cList, catList] = await Promise.all([
      fetchVendorsList(),
      fetchVendorStats(),
      fetchVendorTypes(),
      fetchCountries(),
      fetchCategories(),
    ]);

    dispatch(setVendors(vList || []));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const calculatedNewVendors = (vList || []).filter((v) => {
      if (!v.createdAt) return false;
      const createdAtDate = new Date(v.createdAt);
      return createdAtDate >= thirtyDaysAgo;
    }).length;

    dispatch(setStats({
      totalVendors: vStats?.totalVendors || vList?.length || 0,
      activeVendors: vStats?.activeVendors || vList?.filter((v) => v.status === "active")?.length || 0,
      newVendors: calculatedNewVendors,
      activePurchaseOrders: vStats?.activePurchaseOrders || 0,
    }));
    dispatch(setVendorTypes(vTypes || []));
    dispatch(setCountries(cList || []));
    dispatch(setCategories(catList || []));
    dispatch(setLoading(false));
  }, [dispatch]);

  // Initial Load Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPageData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPageData]);

  // Fetch States when Country changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      const foundCountry = countries.find(c => c.countryName.toLowerCase() === countryName.trim().toLowerCase());
      if (foundCountry) {
        fetchStates(Number(foundCountry.countryId || foundCountry.id)).then((data) => {
          if (isMounted) dispatch(setStates(data || []));
        });
      } else {
        if (isMounted) dispatch(setStates([]));
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [countryName, countries, dispatch]);

  // Fetch Cities when State changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      const foundState = states.find(s => s.stateName.toLowerCase() === stateName.trim().toLowerCase());
      if (foundState) {
        fetchCities(Number(foundState.stateId || foundState.id)).then((data) => {
          if (isMounted) dispatch(setCities(data || []));
        });
      } else {
        if (isMounted) dispatch(setCities([]));
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [stateName, states, dispatch]);

  // Close Action Popover on click outside
  useEffect(() => {
    function handleClickOutside() {
      dispatch(setActiveActionMenuId(null));
    }
    if (activeActionMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeActionMenuId, dispatch]);
  // Handler for adding a new category from the dropdown
  const handleAddNewCategory = async (newCatName: string): Promise<string | void> => {
    const res = await createCategory(newCatName);
    if (res && res.success && res.data) {
      const newCat = res.data;
      dispatch(setCategories([...categories, newCat]));
      const newName = String(newCat.categoryName || newCatName);
      dispatch(updateFormField({ field: "productCategory", value: newName }));
      return newName;
    } else {
      const tempCat: CategoryItem = { id: Date.now(), categoryId: Date.now(), categoryName: newCatName, name: newCatName };
      dispatch(setCategories([...categories, tempCat]));
      dispatch(updateFormField({ field: "productCategory", value: newCatName }));
      return newCatName;
    }
  };

  // Reset Form
  const doResetForm = () => { dispatch(resetForm()); dispatch(setEditingVendorId(null)); };

  const openCreateModal = () => {
    doResetForm();
    dispatch(setShowVendorModal(true));
  };

  const openEditModal = (vendor: VendorItem) => {
    doResetForm();
    dispatch(setEditingVendorId(vendor.vendorId || vendor.id || null));
    
    const formUpdates: Partial<typeof form> = {};
    formUpdates.vendorName = vendor.vendorName || vendor.name || "";
    formUpdates.companyName = vendor.companyName || "";
    formUpdates.vendorTypeId = String(vendor.vendorTypeId || (vendorTypes.length > 0 ? vendorTypes[0].vendorTypeId || vendorTypes[0].id : ""));
    formUpdates.website = vendor.website || "";
    formUpdates.gstin = vendor.gstin || "";
    formUpdates.status = vendor.status === "inactive" ? "inactive" : "active";
    formUpdates.vendorCode = vendor.vendorCode || "";
    formUpdates.panNumber = vendor.panNumber || "";
    formUpdates.currency = vendor.currency || "INR (₹)";
    formUpdates.creditLimit = String(vendor.creditLimit || "");
    formUpdates.productCategory = vendor.productCategory || "";
    formUpdates.preferredProducts = vendor.preferredProducts || "";
    formUpdates.leadTime = vendor.leadTime || "";
    formUpdates.gstCertificate = vendor.gstCertificate || "";
    formUpdates.agreement = vendor.agreement || "";
    formUpdates.vendorLogo = vendor.vendorLogo || "";
    formUpdates.vendorPhone = vendor.phone || "";
    formUpdates.vendorEmail = vendor.email || "";

    if (vendor.addresses && vendor.addresses.length > 0) {
      const addr = vendor.addresses[0];
      formUpdates.addressId = addr.addressId || addr.id || null;
      formUpdates.addressLine = addr.addressLine || "";
      formUpdates.countryName = countries.find((c) => c.countryId === addr.countryId || c.id === addr.countryId)?.countryName || "";
      formUpdates.stateName = states.find((s) => s.stateId === addr.stateId || s.id === addr.stateId)?.stateName || "";
      formUpdates.cityName = cities.find((ct) => ct.cityId === addr.cityId || ct.id === addr.cityId)?.cityName || "";
      formUpdates.pincode = addr.pincode || "";
    }

    if (vendor.contacts && vendor.contacts.length > 0) {
      const cnt = vendor.contacts[0];
      formUpdates.contactId = cnt.vendorContactId || cnt.id || null;
      formUpdates.contactName = cnt.name || "";
      formUpdates.contactEmail = cnt.email || "";
      const mob = cnt.mobile || "";
      if (mob.startsWith("+") && mob.includes(" ")) {
        const [code, ...rest] = mob.split(" ");
        formUpdates.phoneCode = code;
        formUpdates.contactMobile = rest.join(" ");
      } else {
        formUpdates.phoneCode = "+91";
        formUpdates.contactMobile = mob;
      }
    }

    if (vendor.bankDetails && vendor.bankDetails.length > 0) {
      const bnk = vendor.bankDetails[0];
      formUpdates.bankDetailId = bnk.vendorBankDetailId || bnk.id || null;
      formUpdates.accountHolderName = bnk.accountHolderName || "";
      formUpdates.bankName = bnk.bankName || "";
      formUpdates.accountNumber = bnk.accountNumber || "";
      formUpdates.ifscCode = bnk.ifscCode || "";
      formUpdates.branchName = bnk.branchName || "";
      formUpdates.upiId = bnk.upiId || "";
    }

    dispatch(setForm(formUpdates));
    dispatch(setShowVendorModal(true));
  };

  const handleDeleteVendor = (id: number | string) => {
    dispatch(openDeleteDialog(id));
  };

  const confirmDeleteVendor = async () => {
    if (!deleteDialog.vendorId) return;
    const res = await deleteVendor(deleteDialog.vendorId);
    if (res.success) {
      toast.success("Vendor has been removed successfully.");
      loadPageData();
    } else {
      toast.error("Failed to delete vendor.");
    }
    dispatch(closeDeleteDialog());
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!gstin.trim()) {
      toast.error("GSTIN is required");
      return;
    }

    dispatch(setSubmitting(true));

    const typeIdVal = Number(vendorTypeId) || (vendorTypes.length > 0 ? Number(vendorTypes[0].vendorTypeId || vendorTypes[0].id) : 1);

    const payload = {
      vendorName: vendorName.trim(),
      companyName: companyName.trim(),
      vendorTypeId: typeIdVal,
      website: website.trim() || undefined,
      gstin: gstin.trim(),
      status,
      vendorCode: vendorCode.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      currency: currency.trim() || undefined,
      creditLimit: creditLimit.trim() || undefined,
      productCategory: productCategory.trim() || undefined,
      preferredProducts: preferredProducts.trim() || undefined,
      leadTime: leadTime.trim() || undefined,
      gstCertificate: gstCertificate.trim() || undefined,
      agreement: agreement.trim() || undefined,
      vendorLogo: vendorLogo.trim() || undefined,
      phone: vendorPhone.trim() || undefined,
      email: vendorEmail.trim() || undefined,
    };

    let createdVendorId: number | undefined = undefined;

    if (editingVendorId) {
      const res = await updateVendor(editingVendorId, payload);
      if (res.success) {
        toast.success("Vendor has been updated in your vendor list");
        createdVendorId = Number(editingVendorId);
      }
    } else {
      const res = await createVendor(payload);
      if (res.success) {
        toast.success("New Vendor will be added to your vendor list");
        if (res.data && (res.data.vendorId || res.data.id)) {
          createdVendorId = Number(res.data.vendorId || res.data.id);
        }
      }
    }

    // Attach supplementary details if vendor creation/update succeeded and vendorId exists
    if (createdVendorId) {
      const vId = createdVendorId;

      if (addressLine.trim() || countryName.trim() || cityName.trim()) {
        const foundCountry = countries.find(c => c.countryName.toLowerCase() === countryName.trim().toLowerCase());
        const foundState = states.find(s => s.stateName.toLowerCase() === stateName.trim().toLowerCase());
        const foundCity = cities.find(ct => ct.cityName.toLowerCase() === cityName.trim().toLowerCase());

        const addressPayload = {
          addressLine: addressLine.trim(),
          countryId: foundCountry ? (foundCountry.countryId || foundCountry.id || 1) : 1,
          stateId: foundState ? (foundState.stateId || foundState.id || 1) : 1,
          cityId: foundCity ? (foundCity.cityId || foundCity.id || 1) : 1,
          pincode: pincode.trim() || "000000",
          vendorId: vId,
        };
        if (addressId) {
          await updateAddress(addressId, addressPayload);
        } else {
          await createAddress(addressPayload);
        }
      }

      if (contactName.trim() || contactEmail.trim() || contactMobile.trim()) {
        const contactPayload = {
          name: contactName.trim() || vendorName.trim(),
          email: contactEmail.trim() || "",
          mobile: contactMobile.trim() ? `${phoneCode} ${contactMobile.trim()}` : "",
          vendorId: vId,
        };
        if (contactId) {
          await updateVendorContact(contactId, contactPayload);
        } else {
          await createVendorContact(contactPayload);
        }
      }

      if (accountHolderName.trim() || bankName.trim() || accountNumber.trim()) {
        const bankPayload = {
          accountHolderName: accountHolderName.trim() || vendorName.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          branchName: branchName.trim(),
          upiId: upiId.trim() || undefined,
          isPrimary: true,
          vendorId: vId,
        };
        if (bankDetailId) {
          await updateVendorBankDetails(bankDetailId, bankPayload);
        } else {
          await createVendorBankDetails(bankPayload);
        }
      }
    }

    dispatch(setSubmitting(false));
    dispatch(setShowVendorModal(false));
    loadPageData();
  };

  // Dynamic Category options for dropdown
  const categoriesList = ["All", ...Array.from(new Set(vendors.map((v) => {
    const typeObj = v.vendorType;
    if (typeof typeObj === "object" && typeObj !== null) {
      return typeObj.typeName;
    }
    return typeof v.vendorType === "string" ? v.vendorType : "General";
  }).filter(Boolean)))];

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const vName = (v.vendorName || v.name || "").toLowerCase();
    const cName = (v.companyName || "").toLowerCase();
    const matchesSearch = vName.includes(search.toLowerCase()) || cName.includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && (v.status === "active" || !v.status)) ||
      (statusFilter === "Inactive" && v.status === "inactive");

    const categoryName = typeof v.vendorType === "object" && v.vendorType !== null ? v.vendorType.typeName : (typeof v.vendorType === "string" ? v.vendorType : "General");
    const matchesCategory = categoryFilter === "All" || categoryName === categoryFilter;

    const matchesStarred = !starredOnly || Boolean(v.isStarred);

    return matchesSearch && matchesStatus && matchesCategory && matchesStarred;
  });

  // Calculate pagination
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleStarVendor = async (e: React.MouseEvent, vendor: VendorItem) => {
    e.stopPropagation();
    const id = vendor.vendorId || vendor.id;
    if (!id || starLoadingIds.has(id)) return;

    dispatch(addStarLoadingId(id));

    const nextStarred = !vendor.isStarred;
    dispatch(setVendors(
      vendors.map((item) =>
        (item.vendorId || item.id) === id ? { ...item, isStarred: nextStarred } : item
      )
    ));

    const res = await setVendorStarred(id, nextStarred);
    if (!res.success) {
      dispatch(setVendors(
        vendors.map((item) =>
          (item.vendorId || item.id) === id ? { ...item, isStarred: vendor.isStarred } : item
        )
      ));
    }
    
    dispatch(removeStarLoadingId(id));
  };

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.topRow}>
          <h1 className={styles.title}>My Vendors</h1>
          <div className={styles.actionsRight}>
            <button type="button" className={styles.exportBtn} onClick={() => setIsExportOpen(true)}>
              <FiUpload /> Export
            </button>
            <button type="button" className={styles.primaryBtn} onClick={openCreateModal}>
              <FiPlus /> Add Vendor
            </button>
          </div>
        </div>

        {/* Summary KPI Cards Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Vendors</p>
            <p className={styles.statValue}>{stats.totalVendors || vendors.length}</p>
            <span className={styles.statMeta}>All vendor accounts</span>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Active Vendors</p>
            <p className={`${styles.statValue} ${styles.vendorsElement1}`}>
              {stats.activeVendors || vendors.filter((v) => v.status === "active" || !v.status).length}
            </p>
            <span className={styles.statMeta}>Currently active</span>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>New Vendors (This Month)</p>
            <p className={`${styles.statValue} ${styles.vendorsElement2}`}>
              {stats.newVendors || 0}
            </p>
            <span className={styles.statMeta}>Added this month</span>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Active Purchase Orders</p>
            <p className={`${styles.statValue} ${styles.vendorsElement3}`}>
              {stats.activePurchaseOrders || 0}
            </p>
            <span className={styles.statMeta}>In-progress orders</span>
          </div>
        </div>

        {/* Vendors Table Card */}
        <div className={styles.tableCard}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search Products by Name / SKU"
                value={search}
                onChange={(e) => { dispatch(setSearch(e.target.value)); dispatch(setCurrentPage(1)); }}
                className={styles.searchInput}
              />
              <FiSearch className={styles.searchIcon} />
            </div>

            <div className={styles.rightFiltersGroup}>
              <CustomSelect
                options={categoriesList.map((cat) => ({ label: `Category: ${cat}`, value: String(cat) }))}
                value={categoryFilter}
                onChange={(val) => { dispatch(setCategoryFilter(val as string)); dispatch(setCurrentPage(1)); }}
                width="160px"
              />

              <CustomSelect
                options={[
                  { label: "Status: All", value: "All" },
                  { label: "Status: Active", value: "Active" },
                  { label: "Status: Inactive", value: "Inactive" },
                ]}
                value={statusFilter}
                onChange={(val) => { dispatch(setStatusFilter(val as string)); dispatch(setCurrentPage(1)); }}
                width="150px"
              />

              <CustomSelect
                options={[
                  { label: "Last Delivery: All", value: "All" },
                  { label: "Last 7 Days", value: "7days" },
                  { label: "Last 30 Days", value: "30days" },
                ]}
                value={lastDeliveryFilter}
                onChange={(val) => { dispatch(setLastDeliveryFilter(val as string)); dispatch(setCurrentPage(1)); }}
                width="170px"
              />

              <button
                type="button"
                className={`${styles.filterBtn} ${starredOnly ? styles.filterBtnActive : ""}`}
                onClick={() => { dispatch(setStarredOnly(!starredOnly)); dispatch(setCurrentPage(1)); }}
              >
                <FiStar style={{ color: starredOnly ? "#f59e0b" : "#94a3b8" }} />
                Starred
              </button>

              <button
                type="button"
                className={styles.filterBtn}
                onClick={() => {
                  dispatch(setSearch(""));
                  dispatch(setStatusFilter("All"));
                  dispatch(setCategoryFilter("All"));
                  dispatch(setLastDeliveryFilter("All"));
                  dispatch(setStarredOnly(false));
                  dispatch(setCurrentPage(1));
                }}
              >
                See all
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.vendorsElement4}></th>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>Phone Number</th>
                  <th>Active POs</th>
                  <th>Status</th>
                  <th>Last Delivery</th>
                  <th className={styles.vendorsElement5}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className={styles.vendorsElement6}>
                      Loading vendor records from backend...
                    </td>
                  </tr>
                ) : paginatedVendors.length > 0 ? (
                  paginatedVendors.map((v, idx) => {
                    const rowKey = v.vendorId || v.id || idx;
                    const vName = v.vendorName || v.name || "Unnamed Vendor";
                    const contact = v.contacts && v.contacts.length > 0 ? v.contacts[0] : null;
                    const contactPhone = contact?.mobile || (contact as { phone?: string })?.phone || v.phone || "+91 98765 21045";
                    const categoryName = typeof v.vendorType === "object" && v.vendorType !== null ? v.vendorType.typeName : (typeof v.vendorType === "string" ? v.vendorType : "Dairy");
                    const isStarred = Boolean(v.isStarred);

                    return (
                      <tr
                        key={rowKey}
                        onClick={() => router.push(`/vendors/${v.vendorId || v.id}`)}
                        className={styles.vendorsElement7}
                        title="Click to view vendor details"
                      >
                        <td onClick={(e) => {
                          const vendorId = v.vendorId || v.id;
                          if (vendorId && starLoadingIds.has(vendorId)) {
                            e.stopPropagation();
                            return;
                          }
                          toggleStarVendor(e, v);
                        }}>
                          <button
                            type="button"
                            disabled={v.vendorId || v.id ? starLoadingIds.has(v.vendorId || v.id as number | string) : false}
                            className={`${styles.starIconBtn} ${isStarred ? styles.starIconBtnFilled : ""}`}
                            title={isStarred ? "Unstar vendor" : "Star vendor"}
                            style={(v.vendorId || v.id) && starLoadingIds.has(v.vendorId || v.id as number | string) ? { cursor: "not-allowed", opacity: 0.5 } : {}}
                          >
                            <FiStar style={{ fill: isStarred ? "#f59e0b" : "none" }} />
                          </button>
                        </td>
                        <td>
                          <div className={styles.vendorNameCell}>
                            <span className={styles.vendorTitle}>{vName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.vendorsElement8}>{categoryName}</span>
                        </td>
                        <td>
                          <span className={styles.vendorsElement9}>{contactPhone}</span>
                        </td>
                        <td>
                          <span className={styles.vendorsElement10}>
                            {(idx % 3 === 0 ? 12 : idx % 2 === 0 ? 5 : 8)} Orders
                          </span>
                        </td>
                        <td>
                          <span className={v.status === "inactive" ? styles.statusBadgeInactive : styles.statusBadgeActive}>
                            {v.status === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.vendorsElement11}>
                            {formatTimeAgo(v.createdAt)}
                          </span>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.actionMenuBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(setActiveActionMenuId(activeActionMenuId === rowKey ? null : rowKey));
                            }}
                          >
                            <FiMoreVertical />
                          </button>

                          {activeActionMenuId === rowKey && (
                            <div className={styles.actionPopover} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={styles.popoverItem}
                                onClick={() => {
                                  dispatch(setActiveActionMenuId(null));
                                  openEditModal(v);
                                }}
                              >
                                <FiEdit /> Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.popoverItem} ${styles.popoverItemDanger}`}
                                onClick={() => {
                                  dispatch(setActiveActionMenuId(null));
                                  handleDeleteVendor(v.vendorId || v.id || 0);
                                }}
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.vendorsElement12}>
                      No vendor records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalItems={filteredVendors.length}
            pageSize={pageSize}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
            onPageSizeChange={(size) => dispatch(setPageSize(size))}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>

        {/* Add / Edit Vendor Drawer */}
        {showVendorModal && (
          <div className={styles.modalOverlay} onClick={() => setShowVendorModal(false)}>
            <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>{editingVendorId ? "Edit Vendor" : "Create New Vendor"}</h2>
                <button type="button" className={styles.closeBtn} onClick={() => setShowVendorModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmitVendor} className={styles.vendorsElement13}>
                <div className={styles.drawerBody}>
                  {/* Vendor Details */}
                  <h3 className={styles.sectionTitle}>Vendor Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor name <span className={styles.vendorsElement14}>*</span></label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => dispatch(updateFormField({ field: 'vendorName', value: e.target.value }))}
                        placeholder="Enter The Vendor Name"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor ID</label>
                      <input
                        type="text"
                        value={vendorCode}
                        onChange={(e) => dispatch(updateFormField({ field: 'vendorCode', value: e.target.value }))}
                        placeholder="VEN-DNW-001"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => dispatch(updateFormField({ field: 'companyName', value: e.target.value }))}
                        placeholder="Enter The Company Name"
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor Type <span className={styles.vendorsElement15}>*</span></label>
                      <CustomSelect
                        options={
                          vendorTypes.length > 0
                            ? vendorTypes.map((vt) => ({
                                label: vt.typeName,
                                value: String(vt.vendorTypeId || vt.id),
                              }))
                            : [{ label: "Wholesaler", value: "1" }]
                        }
                        value={vendorTypeId || (vendorTypes.length > 0 ? String(vendorTypes[0].vendorTypeId || vendorTypes[0].id) : "1")}
                        onChange={(val) => dispatch(updateFormField({ field: "vendorTypeId", value: val }))}
                        placeholder="Select Vendor Type"
                        width="100%"
                        height="40px"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement16}`}>Contact Information</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Contact Person Name <span className={styles.vendorsElement17}>*</span></label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => dispatch(updateFormField({ field: 'contactName', value: e.target.value }))}
                        placeholder="Enter the Contact Person Name"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Phone Number <span className={styles.vendorsElement18}>*</span></label>
                      <div className={styles.vendorsElement19}>
                        <select 
                          value={phoneCode} 
                          onChange={(e) => dispatch(updateFormField({ field: "phoneCode", value: e.target.value }))}
                          className={`${styles.inputControl} ${styles.vendorsElement20}`}
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+971">+971 (AE)</option>
                        </select>
                        <input
                          type="tel"
                          value={contactMobile}
                          onChange={(e) => dispatch(updateFormField({ field: 'contactMobile', value: e.target.value }))}
                          placeholder="Enter the Phone number"
                          required
                          className={`${styles.inputControl} ${styles.vendorsElement21}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Email Address <span className={styles.vendorsElement22}>*</span></label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => dispatch(updateFormField({ field: 'contactEmail', value: e.target.value }))}
                        placeholder="Enter the Emailid"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => dispatch(updateFormField({ field: 'website', value: e.target.value }))}
                        placeholder="Enter the Website"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Address Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement23}`}>Address Details</h3>
                  <div className={styles.formGrid1}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Address Line <span className={styles.vendorsElement24}>*</span></label>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => dispatch(updateFormField({ field: 'addressLine', value: e.target.value }))}
                        placeholder="Enter The Address"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>City <span className={styles.vendorsElement25}>*</span></label>
                      <input
                        list="city-list"
                        value={cityName}
                        onChange={(e) => dispatch(updateFormField({ field: 'cityName', value: e.target.value }))}
                        placeholder="Enter City Name"
                        required
                        className={styles.inputControl}
                      />
                      <datalist id="city-list">
                        {cities.map((ct) => (
                          <option key={ct.id || ct.cityId} value={ct.cityName} />
                        ))}
                      </datalist>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>State <span className={styles.vendorsElement26}>*</span></label>
                      <input
                        list="state-list"
                        value={stateName}
                        onChange={(e) => dispatch(updateFormField({ field: 'stateName', value: e.target.value }))}
                        placeholder="Enter State Name"
                        required
                        className={styles.inputControl}
                      />
                      <datalist id="state-list">
                        {states.map((s) => (
                          <option key={s.id || s.stateId} value={s.stateName} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Pincode <span className={styles.vendorsElement27}>*</span></label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => dispatch(updateFormField({ field: 'pincode', value: e.target.value }))}
                        placeholder="Enter Pincode"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Country <span className={styles.vendorsElement28}>*</span></label>
                      <input
                        list="country-list"
                        value={countryName}
                        onChange={(e) => dispatch(updateFormField({ field: 'countryName', value: e.target.value }))}
                        placeholder="Enter Country Name"
                        required
                        className={styles.inputControl}
                      />
                      <datalist id="country-list">
                        {countries.map((c) => (
                          <option key={c.id || c.countryId} value={c.countryName} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Business Information */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement29}`}>Business Information</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>GST Number <span className={styles.vendorsElement30}>*</span></label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => dispatch(updateFormField({ field: 'gstin', value: e.target.value }))}
                        placeholder="Enter GST No"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>PAN Number</label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => dispatch(updateFormField({ field: 'panNumber', value: e.target.value }))}
                        placeholder="Enter PAN No"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Currency <span className={styles.vendorsElement31}>*</span></label>
                      <select 
                        value={currency} 
                        onChange={(e) => dispatch(updateFormField({ field: "currency", value: e.target.value }))} 
                        className={styles.inputControl}
                      >
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                        <option value="AUD ($)">AUD ($)</option>
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Credit Limit <span className={styles.vendorsElement32}>*</span></label>
                      <input
                        type="text"
                        value={creditLimit}
                        onChange={(e) => dispatch(updateFormField({ field: 'creditLimit', value: e.target.value }))}
                        placeholder="Enter Credit Limit"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Product / Supply Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement33}`}>Product / Supply Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Product Category <span className={styles.vendorsElement34}>*</span></label>
                      <CustomSelect
                        options={categories.map((c) => ({
                          label: String(c.categoryName || c.name || "Category"),
                          value: String(c.categoryName || c.name || "Category"),
                        }))}
                        value={productCategory}
                        onChange={(val) => dispatch(updateFormField({ field: "productCategory", value: val }))}
                        placeholder="Select Category"
                        onAddNew={handleAddNewCategory}
                        addNewButtonText="+ Add new category"
                        addNewPlaceholder="Enter new category"
                        width="100%"
                        height="40px"
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Preferred Products</label>
                      <input
                        type="text"
                        value={preferredProducts}
                        onChange={(e) => dispatch(updateFormField({ field: 'preferredProducts', value: e.target.value }))}
                        placeholder="Enter Preferred Products"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Lead time (Delivery Days) <span className={styles.vendorsElement35}>*</span></label>
                      <input
                        type="text"
                        value={leadTime}
                        onChange={(e) => dispatch(updateFormField({ field: 'leadTime', value: e.target.value }))}
                        placeholder="Enter Delivery Days"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      {/* Empty column for grid alignment */}
                    </div>
                  </div>

                  {/* Status */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement36}`}>Status</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor Status <span className={styles.vendorsElement37}>*</span></label>
                      <CustomSelect
                        options={[
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                        ]}
                        value={status}
                        onChange={(val) => dispatch(updateFormField({ field: "status", value: val }))}
                        width="100%"
                        height="40px"
                      />
                    </div>
                    <div className={styles.fieldGroup}></div>
                  </div>

                  {/* Bank Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement38}`}>Bank Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Bank Name <span className={styles.vendorsElement39}>*</span></label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => dispatch(updateFormField({ field: 'bankName', value: e.target.value }))}
                        placeholder="Enter Bank Name"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Account Number <span className={styles.vendorsElement40}>*</span></label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => dispatch(updateFormField({ field: 'accountNumber', value: e.target.value }))}
                        placeholder="Enter Account Number"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>IFSC Code <span className={styles.vendorsElement41}>*</span></label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => dispatch(updateFormField({ field: 'ifscCode', value: e.target.value.toUpperCase() }))}
                        placeholder="Enter IFSC Code"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>UPI ID</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => dispatch(updateFormField({ field: 'upiId', value: e.target.value }))}
                        placeholder="Enter UPI ID"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <h3 className={`${styles.sectionTitle} ${styles.vendorsElement42}`}>Attachments</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Upload GST Certificate</label>
                      <div className={styles.vendorsElement43}>
                        <input
                          type="file"
                          id="gst-upload"
                          accept=".pdf,.doc,.docx"
                          className={styles.vendorsElement44}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) dispatch(updateFormField({ field: "gstCertificate", value: file.name }));
                          }}
                        />
                        <label htmlFor="gst-upload" className={styles.vendorsElement45}>
                          <input
                            type="text"
                            readOnly
                            value={gstCertificate}
                            className={`${styles.inputControl} ${styles.vendorsElement46}`}
                          />
                          <span className={styles.vendorsElement47}>
                            <FiPaperclip size={18} />
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Upload Agreement</label>
                      <div className={styles.vendorsElement48}>
                        <input
                          type="file"
                          id="agreement-upload"
                          accept=".pdf,.doc,.docx"
                          className={styles.vendorsElement49}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) dispatch(updateFormField({ field: "agreement", value: file.name }));
                          }}
                        />
                        <label htmlFor="agreement-upload" className={styles.vendorsElement50}>
                          <input
                            type="text"
                            readOnly
                            value={agreement}
                            className={`${styles.inputControl} ${styles.vendorsElement51}`}
                          />
                          <span className={styles.vendorsElement52}>
                            <FiPaperclip size={18} />
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                <div className={`${styles.drawerFooter} ${styles.vendorsElement53}`}>
                  <div className={styles.vendorsElement54}>
                    <span className={styles.vendorsElement55}>🛡️</span> Save Vendor
                  </div>
                  <div className={styles.vendorsElement56}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowVendorModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className={`${styles.saveBtn} ${styles.vendorsElement57}`}>
                      {submitting ? "Saving..." : editingVendorId ? "Save and Update Vendor" : "Save and Add Vendor"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteVendor}
          onCancel={() => dispatch(closeDeleteDialog())}
        />

        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          title="Vendors"
          columns={["Vendor Name", "Category", "Phone Number", "Active POs", "Status", "Last Delivery"]}
          data={filteredVendors.map((v, idx) => {
            const contact = v.contacts && v.contacts.length > 0 ? v.contacts[0] : null;
            const contactPhone = contact?.mobile || (contact as { phone?: string })?.phone || v.phone || "+91 98765 21045";
            const categoryName = typeof v.vendorType === "object" && v.vendorType !== null ? v.vendorType.typeName : (typeof v.vendorType === "string" ? v.vendorType : "Dairy");
            
            return [
              v.vendorName || v.name || "Unnamed Vendor",
              categoryName,
              contactPhone,
              `${(idx % 3 === 0 ? 12 : idx % 2 === 0 ? 5 : 8)} Orders`,
              v.status === "inactive" ? "Inactive" : "Active",
              formatTimeAgo(v.createdAt)
            ];
          })}
          filename="vendors_list"
        />
      </div>
    </DashboardLayout>
  );
}
