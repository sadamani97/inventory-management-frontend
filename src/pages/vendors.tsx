import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomSelect from "@/components/ui/CustomSelect";
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
  VendorStatsResponse,
  VendorTypeItem,
  CountryItem,
  StateItem,
  CityItem,
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
import { showSuccessToast } from "@/components/ui/CustomToast";

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
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [stats, setStats] = useState<VendorStatsResponse>({
    totalVendors: 0,
    activeVendors: 0,
    newVendors: 0,
    activePurchaseOrders: 0,
  });
  const [vendorTypes, setVendorTypes] = useState<VendorTypeItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lastDeliveryFilter, setLastDeliveryFilter] = useState("All");
  const [starredOnly, setStarredOnly] = useState(false);

  // Popover State
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | string | null>(null);

  // Modal / Drawer State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<number | string | null>(null);

  // Star Loading State
  const [starLoadingIds, setStarLoadingIds] = useState<Set<number | string>>(new Set());

  // ID states for editing nested entities
  const [addressId, setAddressId] = useState<number | string | null>(null);
  const [contactId, setContactId] = useState<number | string | null>(null);
  const [bankDetailId, setBankDetailId] = useState<number | string | null>(null);

  // Form Fields
  const [vendorName, setVendorName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vendorTypeId, setVendorTypeId] = useState<string>("");
  const [website, setWebsite] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [vendorCode, setVendorCode] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [currency, setCurrency] = useState("INR (₹)");
  const [creditLimit, setCreditLimit] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [preferredProducts, setPreferredProducts] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [gstCertificate, setGstCertificate] = useState("");
  const [agreement, setAgreement] = useState("");
  const [vendorLogo, setVendorLogo] = useState("");
  const [phoneCode, setPhoneCode] = useState("+91");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");

  // Address Fields
  const [addressLine, setAddressLine] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");

  // Contact Person Fields
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMobile, setContactMobile] = useState("");

  // Bank Details Fields
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [upiId, setUpiId] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Initial Load Data function
  const loadPageData = async () => {
    setLoading(true);
    const [vList, vStats, vTypes, cList, catList] = await Promise.all([
      fetchVendorsList(),
      fetchVendorStats(),
      fetchVendorTypes(),
      fetchCountries(),
      fetchCategories(),
    ]);

    setVendors(vList || []);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const calculatedNewVendors = (vList || []).filter((v) => {
      if (!v.createdAt) return false;
      const createdAtDate = new Date(v.createdAt);
      return createdAtDate >= thirtyDaysAgo;
    }).length;

    setStats({
      totalVendors: vStats?.totalVendors || vList?.length || 0,
      activeVendors: vStats?.activeVendors || vList?.filter((v) => v.status === "active")?.length || 0,
      newVendors: calculatedNewVendors,
      activePurchaseOrders: vStats?.activePurchaseOrders || 0,
    });
    setVendorTypes(vTypes || []);
    setCountries(cList || []);
    setCategories(catList || []);
    setLoading(false);
  };

  // Initial Load Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPageData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch States when Country changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      const foundCountry = countries.find(c => c.countryName.toLowerCase() === countryName.trim().toLowerCase());
      if (foundCountry) {
        fetchStates(Number(foundCountry.countryId || foundCountry.id)).then((data) => {
          if (isMounted) setStates(data || []);
        });
      } else {
        if (isMounted) setStates([]);
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [countryName, countries]);

  // Fetch Cities when State changes
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      const foundState = states.find(s => s.stateName.toLowerCase() === stateName.trim().toLowerCase());
      if (foundState) {
        fetchCities(Number(foundState.stateId || foundState.id)).then((data) => {
          if (isMounted) setCities(data || []);
        });
      } else {
        if (isMounted) setCities([]);
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [stateName, states]);

  // Close Action Popover on click outside
  useEffect(() => {
    function handleClickOutside() {
      setActiveActionMenuId(null);
    }
    if (activeActionMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeActionMenuId]);
  // Handler for adding a new category from the dropdown
  const handleAddNewCategory = async (newCatName: string): Promise<string | void> => {
    const res = await createCategory(newCatName);
    if (res && res.success && res.data) {
      const newCat = res.data;
      setCategories((prev) => [...prev, newCat]);
      const newName = String(newCat.categoryName || newCatName);
      setProductCategory(newName);
      return newName;
    } else {
      const tempCat = { categoryId: Date.now() as unknown as number, categoryName: newCatName };
      setCategories((prev) => [...prev, tempCat]);
      setProductCategory(newCatName);
      return newCatName;
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingVendorId(null);
    setAddressId(null);
    setContactId(null);
    setBankDetailId(null);
    setVendorName("");
    setCompanyName("");
    setVendorTypeId("");
    setWebsite("");
    setGstin("");
    setStatus("active");
    setVendorCode("");
    setPanNumber("");
    setCurrency("INR (₹)");
    setCreditLimit("");
    setProductCategory("");
    setPreferredProducts("");
    setLeadTime("");
    setGstCertificate("");
    setAgreement("");
    setVendorLogo("");
    setPhoneCode("+91");
    setVendorPhone("");
    setVendorEmail("");

    setAddressLine("");
    setCountryName("");
    setStateName("");
    setCityName("");
    setPincode("");

    setContactName("");
    setContactEmail("");
    setContactMobile("");

    setAccountHolderName("");
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    setBranchName("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowVendorModal(true);
  };

  const openEditModal = (vendor: VendorItem) => {
    resetForm();
    setEditingVendorId(vendor.vendorId || vendor.id || null);
    setVendorName(vendor.vendorName || vendor.name || "");
    setCompanyName(vendor.companyName || "");
    setVendorTypeId(String(vendor.vendorTypeId || (vendorTypes.length > 0 ? vendorTypes[0].vendorTypeId || vendorTypes[0].id : "")));
    setWebsite(vendor.website || "");
    setGstin(vendor.gstin || "");
    setStatus(vendor.status === "inactive" ? "inactive" : "active");
    setVendorCode(vendor.vendorCode || "");
    setPanNumber(vendor.panNumber || "");
    setCurrency(vendor.currency || "INR (₹)");
    setCreditLimit(String(vendor.creditLimit || ""));
    setProductCategory(vendor.productCategory || "");
    setPreferredProducts(vendor.preferredProducts || "");
    setLeadTime(vendor.leadTime || "");
    setGstCertificate(vendor.gstCertificate || "");
    setAgreement(vendor.agreement || "");
    setVendorLogo(vendor.vendorLogo || "");
    setVendorPhone(vendor.phone || "");
    setVendorEmail(vendor.email || "");

    if (vendor.addresses && vendor.addresses.length > 0) {
      const addr = vendor.addresses[0];
      setAddressId(addr.addressId || addr.id || null);
      setAddressLine(addr.addressLine || "");
      
      const cName = countries.find(c => c.countryId === addr.countryId || c.id === addr.countryId)?.countryName || "";
      setCountryName(cName);
      
      const sName = states.find(s => s.stateId === addr.stateId || s.id === addr.stateId)?.stateName || "";
      setStateName(sName);
      
      const ctName = cities.find(ct => ct.cityId === addr.cityId || ct.id === addr.cityId)?.cityName || "";
      setCityName(ctName);
      
      setPincode(addr.pincode || "");
    }

    if (vendor.contacts && vendor.contacts.length > 0) {
      const cnt = vendor.contacts[0];
      setContactId(cnt.vendorContactId || cnt.id || null);
      setContactName(cnt.name || "");
      setContactEmail(cnt.email || "");
      const mob = cnt.mobile || "";
      if (mob.startsWith("+") && mob.includes(" ")) {
        const [code, ...rest] = mob.split(" ");
        setPhoneCode(code);
        setContactMobile(rest.join(" "));
      } else {
        setPhoneCode("+91");
        setContactMobile(mob);
      }
    }

    if (vendor.bankDetails && vendor.bankDetails.length > 0) {
      const bnk = vendor.bankDetails[0];
      setBankDetailId(bnk.vendorBankDetailId || bnk.id || null);
      setAccountHolderName(bnk.accountHolderName || "");
      setBankName(bnk.bankName || "");
      setAccountNumber(bnk.accountNumber || "");
      setIfscCode(bnk.ifscCode || "");
      setBranchName(bnk.branchName || "");
      setUpiId(bnk.upiId || "");
    }

    setShowVendorModal(true);
  };

  const handleDeleteVendor = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    const res = await deleteVendor(id);
    if (res.success) {
      showSuccessToast("Deleted Vendor", "Vendor has been removed from your vendor list", <FiTrash2 size={44} color="#0f172a" strokeWidth={1.5} />);
      loadPageData();
    }
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

    setSubmitting(true);

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
        showSuccessToast("Updated Vendor", "Vendor has been updated in your vendor list", <FiEdit size={44} color="#0f172a" strokeWidth={1.5} />);
        createdVendorId = Number(editingVendorId);
      }
    } else {
      const res = await createVendor(payload);
      if (res.success) {
        showSuccessToast("Added New Vendor", "New Vendor will be added to your vendor list", <FiUserPlus size={44} color="#0f172a" strokeWidth={1.5} />);
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

    setSubmitting(false);
    setShowVendorModal(false);
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

  const toggleStarVendor = async (e: React.MouseEvent, vendor: VendorItem) => {
    e.stopPropagation();
    const id = vendor.vendorId || vendor.id;
    if (!id || starLoadingIds.has(id)) return;

    setStarLoadingIds((prev) => new Set(prev).add(id));

    const nextStarred = !vendor.isStarred;
    setVendors((prev) =>
      prev.map((item) =>
        (item.vendorId || item.id) === id ? { ...item, isStarred: nextStarred } : item
      )
    );

    const res = await setVendorStarred(id, nextStarred);
    if (!res.success) {
      setVendors((prev) =>
        prev.map((item) =>
          (item.vendorId || item.id) === id ? { ...item, isStarred: vendor.isStarred } : item
        )
      );
    }
    
    setStarLoadingIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Header */}
        <div className={styles.topRow}>
          <h1 className={styles.title}>My Vendors</h1>
          <div className={styles.actionsRight}>
            <button type="button" className={styles.exportBtn}>
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
            <p className={`${styles.statValue} ${styles.autoStyle086964}`}>
              {stats.activeVendors || vendors.filter((v) => v.status === "active" || !v.status).length}
            </p>
            <span className={styles.statMeta}>Currently active</span>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>New Vendors (This Month)</p>
            <p className={`${styles.statValue} ${styles.autoStyle0919da}`}>
              {stats.newVendors || 0}
            </p>
            <span className={styles.statMeta}>Added this month</span>
          </div>

          <div className={styles.statCard}>
            <p className={styles.statLabel}>Active Purchase Orders</p>
            <p className={`${styles.statValue} ${styles.autoStyle668cc7}`}>
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
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <FiSearch className={styles.searchIcon} />
            </div>

            <div className={styles.rightFiltersGroup}>
              <CustomSelect
                options={categoriesList.map((cat) => ({ label: `Category: ${cat}`, value: String(cat) }))}
                value={categoryFilter}
                onChange={setCategoryFilter}
                width="160px"
              />

              <CustomSelect
                options={[
                  { label: "Status: All", value: "All" },
                  { label: "Status: Active", value: "Active" },
                  { label: "Status: Inactive", value: "Inactive" },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                width="150px"
              />

              <CustomSelect
                options={[
                  { label: "Last Delivery: All", value: "All" },
                  { label: "Last 7 Days", value: "7days" },
                  { label: "Last 30 Days", value: "30days" },
                ]}
                value={lastDeliveryFilter}
                onChange={setLastDeliveryFilter}
                width="170px"
              />

              <button
                type="button"
                className={`${styles.filterBtn} ${starredOnly ? styles.filterBtnActive : ""}`}
                onClick={() => setStarredOnly(!starredOnly)}
              >
                <FiStar style={{ color: starredOnly ? "#f59e0b" : "#94a3b8" }} />
                Starred
              </button>

              <button
                type="button"
                className={styles.filterBtn}
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                  setLastDeliveryFilter("All");
                  setStarredOnly(false);
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
                  <th className={styles.autoStyleb883a8}></th>
                  <th>Vendor Name</th>
                  <th>Category</th>
                  <th>Phone Number</th>
                  <th>Active POs</th>
                  <th>Status</th>
                  <th>Last Delivery</th>
                  <th className={styles.autoStylee4386d}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className={styles.autoStylefc08ab}>
                      Loading vendor records from backend...
                    </td>
                  </tr>
                ) : filteredVendors.length > 0 ? (
                  filteredVendors.map((v, idx) => {
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
                        className={styles.autoStyle51893b}
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
                          <span className={styles.autoStyle6012df}>{categoryName}</span>
                        </td>
                        <td>
                          <span className={styles.autoStyle691ffe}>{contactPhone}</span>
                        </td>
                        <td>
                          <span className={styles.autoStyleb5e5dd}>
                            {(idx % 3 === 0 ? 12 : idx % 2 === 0 ? 5 : 8)} Orders
                          </span>
                        </td>
                        <td>
                          <span className={v.status === "inactive" ? styles.statusBadgeInactive : styles.statusBadgeActive}>
                            {v.status === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td>
                          <span className={styles.autoStyle7f3fba}>
                            {formatTimeAgo(v.createdAt)}
                          </span>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            type="button"
                            className={styles.actionMenuBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuId(activeActionMenuId === rowKey ? null : rowKey);
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
                                  setActiveActionMenuId(null);
                                  openEditModal(v);
                                }}
                              >
                                <FiEdit /> Edit
                              </button>
                              <button
                                type="button"
                                className={`${styles.popoverItem} ${styles.popoverItemDanger}`}
                                onClick={() => {
                                  setActiveActionMenuId(null);
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
                    <td colSpan={8} className={styles.autoStyle15f9a2}>
                      No vendor records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

              <form onSubmit={handleSubmitVendor} className={styles.autoStyle926e2d}>
                <div className={styles.drawerBody}>
                  {/* Vendor Details */}
                  <h3 className={styles.sectionTitle}>Vendor Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor name <span className={styles.autoStyle3e4228}>*</span></label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
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
                        onChange={(e) => setVendorCode(e.target.value)}
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
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter The Company Name"
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor Type <span className={styles.autoStylee2ad41}>*</span></label>
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
                        onChange={setVendorTypeId}
                        placeholder="Select Vendor Type"
                        width="100%"
                        height="40px"
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle433539}`}>Contact Information</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Contact Person Name <span className={styles.autoStyle550717}>*</span></label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Enter the Contact Person Name"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Phone Number <span className={styles.autoStyle95ce14}>*</span></label>
                      <div className={styles.autoStylefe223f}>
                        <select 
                          value={phoneCode} 
                          onChange={(e) => setPhoneCode(e.target.value)}
                          className={`${styles.inputControl} ${styles.autoStyleb8f13a}`}
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
                          onChange={(e) => setContactMobile(e.target.value)}
                          placeholder="Enter the Phone number"
                          required
                          className={`${styles.inputControl} ${styles.autoStylee08b89}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Email Address <span className={styles.autoStylef396f0}>*</span></label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
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
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Enter the Website"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Address Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle68ff68}`}>Address Details</h3>
                  <div className={styles.formGrid1}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Address Line <span className={styles.autoStyle8ebcc8}>*</span></label>
                      <input
                        type="text"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="Enter The Address"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>City <span className={styles.autoStyle5bd104}>*</span></label>
                      <input
                        list="city-list"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
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
                      <label className={styles.label}>State <span className={styles.autoStylea7b623}>*</span></label>
                      <input
                        list="state-list"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
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
                      <label className={styles.label}>Pincode <span className={styles.autoStyledcf1b3}>*</span></label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Enter Pincode"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Country <span className={styles.autoStyle426164}>*</span></label>
                      <input
                        list="country-list"
                        value={countryName}
                        onChange={(e) => setCountryName(e.target.value)}
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
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle731b86}`}>Business Information</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>GST Number <span className={styles.autoStyleb346df}>*</span></label>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
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
                        onChange={(e) => setPanNumber(e.target.value)}
                        placeholder="Enter PAN No"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Currency <span className={styles.autoStylec54485}>*</span></label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)} 
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
                      <label className={styles.label}>Credit Limit <span className={styles.autoStyleb50a87}>*</span></label>
                      <input
                        type="text"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="Enter Credit Limit"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Product / Supply Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.autoStylebe58e6}`}>Product / Supply Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Product Category <span className={styles.autoStyle9115f1}>*</span></label>
                      <CustomSelect
                        options={categories.map((c) => ({
                          label: String(c.categoryName || c.name || "Category"),
                          value: String(c.categoryName || c.name || "Category"),
                        }))}
                        value={productCategory}
                        onChange={setProductCategory}
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
                        onChange={(e) => setPreferredProducts(e.target.value)}
                        placeholder="Enter Preferred Products"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Lead time (Delivery Days) <span className={styles.autoStyleead3dd}>*</span></label>
                      <input
                        type="text"
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
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
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle8f986f}`}>Status</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Vendor Status <span className={styles.autoStyle4e9a07}>*</span></label>
                      <CustomSelect
                        options={[
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                        ]}
                        value={status}
                        onChange={(val) => setStatus(val as "active" | "inactive")}
                        width="100%"
                        height="40px"
                      />
                    </div>
                    <div className={styles.fieldGroup}></div>
                  </div>

                  {/* Bank Details */}
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle36334e}`}>Bank Details</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Bank Name <span className={styles.autoStyle5b0812}>*</span></label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter Bank Name"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Account Number <span className={styles.autoStylea066a6}>*</span></label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter Account Number"
                        required
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>IFSC Code <span className={styles.autoStyle3f840a}>*</span></label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
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
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter UPI ID"
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  {/* Attachments */}
                  <h3 className={`${styles.sectionTitle} ${styles.autoStyle2f29c9}`}>Attachments</h3>
                  <div className={styles.formGrid2}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Upload GST Certificate</label>
                      <div className={styles.autoStyle41dade}>
                        <input
                          type="file"
                          id="gst-upload"
                          accept=".pdf,.doc,.docx"
                          className={styles.autoStyle1e407f}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setGstCertificate(file.name);
                          }}
                        />
                        <label htmlFor="gst-upload" className={styles.autoStyleef312f}>
                          <input
                            type="text"
                            readOnly
                            value={gstCertificate}
                            className={`${styles.inputControl} ${styles.autoStyle96824d}`}
                          />
                          <span className={styles.autoStyle324560}>
                            <FiPaperclip size={18} />
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Upload Agreement</label>
                      <div className={styles.autoStyle67e53d}>
                        <input
                          type="file"
                          id="agreement-upload"
                          accept=".pdf,.doc,.docx"
                          className={styles.autoStyle0a727a}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setAgreement(file.name);
                          }}
                        />
                        <label htmlFor="agreement-upload" className={styles.autoStyleb5a572}>
                          <input
                            type="text"
                            readOnly
                            value={agreement}
                            className={`${styles.inputControl} ${styles.autoStyle8312ce}`}
                          />
                          <span className={styles.autoStyle28d012}>
                            <FiPaperclip size={18} />
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                <div className={`${styles.drawerFooter} ${styles.autoStylef7edeb}`}>
                  <div className={styles.autoStylea58f4d}>
                    <span className={styles.autoStyle6eec55}>🛡️</span> Save Vendor
                  </div>
                  <div className={styles.autoStyle8a3bc1}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowVendorModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className={`${styles.saveBtn} ${styles.autoStyle993744}`}>
                      {submitting ? "Saving..." : editingVendorId ? "Save and Update Vendor" : "Save and Add Vendor"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
