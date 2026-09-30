import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import styles from "@/styles/pages/vendorDetails.module.css";
import {
  fetchVendorById,
  fetchProductsList,
  fetchPurchaseOrdersList,
  setVendorStarred,
  VendorItem,
  ProductItem,
} from "@/lib/dashboardApi";
import {
  FiArrowLeft,
  FiEdit,
  FiMoreHorizontal,
  FiStar,
  FiSearch,
  FiPlus,
  FiPhone,
  FiMail,
  FiGlobe,
  FiTruck,
  FiMapPin,
  FiBriefcase,
  FiTag,
  FiFileText,
  FiCreditCard,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";

type ExtendedProduct = ProductItem & {
  vendor_id?: number | string;
  vendor?: { id?: number | string; vendorId?: number | string };
  category?: string | { categoryName?: string };
  name?: string;
  stock?: number;
  price?: number;
};

type ExtendedVendor = VendorItem & {
  vendorCode?: string;
  description?: string;
  address?: string;
  addressLine?: string;
  addressLine1?: string;
  mobileNumber?: string;
  mobile?: string;
};

type ExtendedAddress = {
  addressLine1?: string;
  addressLine?: string;
  city?: string | { cityName?: string; name?: string };
  state?: string | { stateName?: string; name?: string };
  country?: string | { countryName?: string; name?: string };
  pincode?: string;
};

type ExtendedPO = {
  vendorId?: number | string;
  vendor_id?: number | string;
  vendorName?: string;
  vendor?: { id?: number | string; vendorId?: number | string };
  poNumber?: string;
  orderNumber?: string;
  totalAmount?: number;
  grandTotal?: number;
  amount?: number;
  total?: number;
  createdAt?: string | number | Date;
  orderDate?: string | number | Date;
  date?: string | number | Date;
  status?: string;
  id?: number | string;
  description?: string;
  productName?: string;
  items?: unknown[];
};

export default function VendorDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ExtendedPO[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "transaction" | "reviews">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const vendorIdStr = Array.isArray(id) ? id[0] : id;

    async function loadData() {
      setLoading(true);
      try {
        const [vendorRes, prodRes, poRes] = await Promise.allSettled([
          fetchVendorById(vendorIdStr),
          fetchProductsList(),
          fetchPurchaseOrdersList(),
        ]);

        if (vendorRes.status === "fulfilled" && vendorRes.value) {
          setVendor(vendorRes.value);
        } else {
          toast.error("Failed to load vendor details");
        }

        if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
          // Filter products for this specific vendor if vendorId matches
          const vendorProds = (prodRes.value as ExtendedProduct[]).filter((p) => {
            const pVId = p.vendorId || p.vendor_id || (p.vendor && (p.vendor.id || p.vendor.vendorId));
            return pVId && String(pVId) === String(vendorIdStr);
          });
          // Fix: show only vendor's products, if none exist, set to empty array instead of showing all
          setProducts(vendorProds);
        }

        if (poRes.status === "fulfilled" && Array.isArray(poRes.value)) {
          const matchedPOs = (poRes.value as unknown as ExtendedPO[]).filter((po) => {
            const vId = po.vendorId || po.vendor_id || (po.vendor && (po.vendor.id || po.vendor.vendorId));
            if (vId && String(vId) === String(vendorIdStr)) return true;
            if (vendorRes.status === "fulfilled" && vendorRes.value) {
              const vName = vendorRes.value.vendorName || (vendorRes.value as { name?: string }).name;
              if (po.vendorName && vName && po.vendorName.toLowerCase() === vName.toLowerCase()) {
                return true;
              }
            }
            return false;
          });
          setPurchaseOrders(matchedPOs);
        }
      } catch (err) {
        console.error("Error loading vendor details page:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading vendor details...
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) {
    return (
      <DashboardLayout>
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <h3>Vendor not found</h3>
          <button
            onClick={() => router.push("/vendors")}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Back to Vendors
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const vendorObj = vendor as ExtendedVendor;

  // Extract contact info checking both contacts array and direct vendor fields
  const primaryContact = vendorObj.contacts && vendorObj.contacts.length > 0 ? (vendorObj.contacts[0] as { mobileNumber?: string; phone?: string; mobile?: string; email?: string }) : null;
  const phoneVal = primaryContact?.mobileNumber || primaryContact?.mobile || primaryContact?.phone || vendorObj.phone || vendorObj.mobileNumber || vendorObj.mobile || "N/A";
  const emailVal = primaryContact?.email || vendorObj.email || "N/A";

  // Extract address info checking both addresses array and direct vendor fields
  const primaryAddress = vendorObj.addresses && vendorObj.addresses.length > 0 ? vendorObj.addresses[0] : null;
  const addressObj = primaryAddress as ExtendedAddress | null;
  let fullAddress = "";
  if (addressObj) {
    const parts = [
      addressObj.addressLine1 || addressObj.addressLine,
      typeof addressObj.city === "object" ? addressObj.city?.cityName || addressObj.city?.name : addressObj.city,
      typeof addressObj.state === "object" ? addressObj.state?.stateName || addressObj.state?.name : addressObj.state,
      typeof addressObj.country === "object" ? addressObj.country?.countryName || addressObj.country?.name : addressObj.country,
      addressObj.pincode,
    ].filter(Boolean);
    fullAddress = parts.join(", ");
  }
  if (!fullAddress || fullAddress.trim() === "") {
    fullAddress = vendorObj.address || vendorObj.addressLine || vendorObj.addressLine1 || "N/A";
  }

  // Categories list for filter dropdown
  const categories = ["All", ...Array.from(new Set((products as ExtendedProduct[]).map((p) => typeof p.category === "object" ? (p.category as { categoryName?: string })?.categoryName : p.category || "General")))] as string[];

  // Filtered product catalog
  const filteredProducts = (products as ExtendedProduct[]).filter((p) => {
    const matchesSearch =
      (p.name || p.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
    const catName = typeof p.category === "object" ? (p.category as { categoryName?: string })?.categoryName : p.category || "General";
    const matchesCat = selectedCategory === "All" || catName === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const joinedDate = vendorObj.createdAt
    ? new Date(vendorObj.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Top Navigation Row */}
        <div className={styles.topBreadcrumbRow}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.push("/vendors")}>
              <FiArrowLeft />
            </button>
            <Image
              src={vendorObj?.vendorLogo ? `/${vendorObj.vendorLogo}` : "/product/Dailyneed.png"}
              alt="Vendor Logo"
              width={44}
              height={44}
              className={styles.vendorLogoHeader}
            />
            <div>
              <div className={styles.vendorTitleRow}>
                <h1 className={styles.vendorName}>
                  {vendorObj.vendorName || vendorObj.name || "Vendor Details"}
                </h1>
                <span
                  className={
                    (vendorObj.status || "active").toLowerCase() === "active"
                      ? styles.statusPillActive
                      : styles.statusPillInactive
                  }
                >
                  ✓ {vendorObj.status ? vendorObj.status.charAt(0).toUpperCase() + vendorObj.status.slice(1) : "Active"}
                </span>
              </div>
              <div className={styles.vendorSubMeta}>
                <span className={styles.vendorCodeTag}>
                  {vendorObj.vendorCode || `VEN-${String(vendorObj.vendorId || vendorObj.id || id).padStart(3, "0")}`}
                </span>
                <span className={styles.metaDot}>•</span>
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.iconBtn}
              onClick={() => router.push("/vendors")}
              title="Edit Vendor in Vendors List"
            >
              <FiEdit />
            </button>
            <button className={styles.iconBtn} onClick={() => toast.info("More actions")}>
              <FiMoreHorizontal />
            </button>
            <button
              className={styles.iconBtn}
              title={vendorObj.isStarred ? "Unstar vendor" : "Star vendor"}
              onClick={async () => {
                const vendorId = vendorObj.vendorId || vendorObj.id;
                if (!vendorId) return;
                const nextStarred = !vendorObj.isStarred;
                setVendor({ ...vendorObj, isStarred: nextStarred });
                const res = await setVendorStarred(vendorId, nextStarred);
                if (!res.success) {
                  setVendor({ ...vendorObj, isStarred: vendorObj.isStarred });
                }
              }}
            >
              <FiStar style={{ fill: vendorObj.isStarred ? "#f59e0b" : "none", color: vendorObj.isStarred ? "#f59e0b" : undefined }} />
            </button>
            <button
              className={styles.createPoBtn}
              onClick={() => router.push("/purchase-orders")}
            >
              <FiPlus /> Create Purchase Order
            </button>
          </div>
        </div>

        {/* Vendor Description */}
        {vendorObj.description && (
          <p className={styles.vendorDesc}>
            {vendorObj.description}
          </p>
        )}

        {/* 2-Column Main Layout Grid */}
        <div className={styles.mainLayoutGrid}>
          {/* Left Column: Supplier Details & Rating */}
          <div className={styles.leftCol}>
            {/* Supplier Details */}
            <div>
              <div className={styles.sectionHeaderTitle}>Supplier Details</div>
              <div className={styles.supplierDetailsList}>
                {vendorObj.companyName && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiBriefcase className={styles.detailIcon} />
                      <span>Company Name</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.companyName}
                    </div>
                  </div>
                )}

                {vendorObj.vendorType && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiTag className={styles.detailIcon} />
                      <span>Vendor Type</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.vendorType.name || "N/A"}
                    </div>
                  </div>
                )}

                {vendorObj.gstin && (
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiFileText className={styles.detailIcon} />
                      <span>GSTIN</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.gstin}
                    </div>
                  </div>
                )}

                <div className={styles.detailRow}>
                  <div className={styles.detailLabelGroup}>
                    <FiPhone className={styles.detailIcon} />
                    <span>Phone number</span>
                  </div>
                  <div className={styles.detailValueBox}>
                    {phoneVal}
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailLabelGroup}>
                    <FiMail className={styles.detailIcon} />
                    <span>Email</span>
                  </div>
                  <div className={styles.detailValueBox}>
                    {emailVal}
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailLabelGroup}>
                    <FiGlobe className={styles.detailIcon} />
                    <span>Website</span>
                  </div>
                  <div className={styles.detailValueBox}>
                    {vendorObj.website || "N/A"}
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailLabelGroup}>
                    <FiTruck className={styles.detailIcon} />
                    <span>Shipping Carrier</span>
                  </div>
                  <div className={styles.carriersGroup}>
                    <Image
                      src="/product/indiamart.png"
                      alt="IndiaMART"
                      width={80}
                      height={24}
                      className={styles.carrierLogoImg}
                    />

                    <Image
                      src="/product/tradeindia.png"
                      alt="TradeIndia"
                      width={80}
                      height={24}
                      className={styles.carrierLogoImg}
                    />
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <div className={styles.detailLabelGroup}>
                    <FiMapPin className={styles.detailIcon} />
                    <span>Address</span>
                  </div>
                  <div className={styles.detailValueBox}>
                    {fullAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            {vendorObj.bankDetails && vendorObj.bankDetails.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div className={styles.sectionHeaderTitle}>Bank Details</div>
                <div className={styles.supplierDetailsList}>
                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiCreditCard className={styles.detailIcon} />
                      <span>Bank Name</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.bankDetails[0].bankName || "N/A"}
                    </div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiUser className={styles.detailIcon} />
                      <span>Account Holder</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.bankDetails[0].accountHolderName || "N/A"}
                    </div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiFileText className={styles.detailIcon} />
                      <span>Account Number</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.bankDetails[0].accountNumber || "N/A"}
                    </div>
                  </div>

                  <div className={styles.detailRow}>
                    <div className={styles.detailLabelGroup}>
                      <FiTag className={styles.detailIcon} />
                      <span>IFSC Code</span>
                    </div>
                    <div className={styles.detailValueBox}>
                      {vendorObj.bankDetails[0].ifscCode || "N/A"}
                    </div>
                  </div>

                  {vendorObj.bankDetails[0].branchName && (
                    <div className={styles.detailRow}>
                      <div className={styles.detailLabelGroup}>
                        <FiMapPin className={styles.detailIcon} />
                        <span>Branch Name</span>
                      </div>
                      <div className={styles.detailValueBox}>
                        {vendorObj.bankDetails[0].branchName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ratings Breakdown */}
            <div className={styles.ratingsSection}>
              <div className={styles.ratingsTopRow}>
                <span className={styles.sectionHeaderTitle} style={{ margin: 0 }}>Ratings</span>
                <span className={styles.viewAllRatingsLink} onClick={() => toast.info("Viewing all ratings")}>
                  View all ratings
                </span>
              </div>

              <div className={styles.scoreRow}>
                <span className={styles.bigScore}>4.3</span>
                <div className={styles.starsGroup}>
                  <Image
                    src="/product/Stars.png"
                    alt="Rating Stars"
                    width={90}
                    height={18}
                    className={styles.starsImg}
                  />
                  <span className={styles.totalReviewsText}>4807 reviews</span>
                </div>
              </div>

              <div className={styles.breakdownList}>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>5 - Excellent</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: "75%" }} />
                  </div>
                  <span className={styles.breakdownCount}>2,200</span>
                </div>

                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>4 - Good</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: "35%" }} />
                  </div>
                  <span className={styles.breakdownCount}>550</span>
                </div>

                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>3 - Okay</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: "35%" }} />
                  </div>
                  <span className={styles.breakdownCount}>550</span>
                </div>

                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>2 - Disappointment</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: "25%" }} />
                  </div>
                  <span className={styles.breakdownCount}>407</span>
                </div>

                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>1 - Terrible</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: "10%" }} />
                  </div>
                  <span className={styles.breakdownCount}>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Catalog / Transaction Tabs */}
          <div className={styles.rightCol}>
            <div className={styles.tabHeaderRow}>
              <button
                className={`${styles.tabBtn} ${activeTab === "catalog" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("catalog")}
              >
                Product catalog <span className={styles.badgeCount}>{filteredProducts.length}</span>
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "transaction" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("transaction")}
              >
                Transaction ({purchaseOrders.length})
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "reviews" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                Customer Review
              </button>
            </div>

            {activeTab === "catalog" && (
              <>
                <div className={styles.searchFilterRow}>
                  <div className={styles.searchInputBox}>
                    <FiSearch style={{ color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder="Search"
                      className={styles.searchInput}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.categorySelect}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        Category: {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className={styles.catalogTable}>
                    <thead>
                      <tr>
                        <th>Product name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Min.Order</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                            No products found in catalog.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((prod, idx) => {
                          const stockQty = Number(prod.quantity || prod.stock || 0);
                          let statusText = "Active";
                          let statusClass = styles.statusActive;
                          if (stockQty === 0) {
                            statusText = "Inactive";
                            statusClass = styles.statusInactive;
                          } else if (stockQty <= (prod.lowStockLimit || prod.minStock || 20)) {
                            statusText = "Low Stock";
                            statusClass = styles.statusLowStock;
                          }

                          return (
                            <tr key={prod.id || prod.productId || idx}>
                              <td className={styles.productNameCell}>{prod.name || prod.productName}</td>
                              <td className={styles.skuCell}>{prod.sku || `NES-IF-10${idx + 1}`}</td>
                              <td>
                                {typeof prod.category === "object"
                                  ? prod.category?.categoryName || prod.category?.name
                                  : prod.category || "General"}
                              </td>
                              <td>{prod.minOrder || `${prod.lowStockLimit || 50} Packs`}</td>
                              <td>
                                <span className={statusClass}>{statusText}</span>
                              </td>
                              <td>
                                <button className={styles.actionDotsBtn} title="Actions">
                                  <FiMoreHorizontal />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "transaction" && (
              <div style={{ overflowX: "auto", marginTop: "12px" }}>
                <table className={styles.catalogTable}>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "24px" }}>
                          No transactions found for this vendor.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po, idx) => (
                        <tr key={po.id || idx}>
                          <td style={{ fontWeight: 600, color: "#2563eb" }}>
                            {po.poNumber || po.orderNumber || `PO-#100${idx + 1}`}
                          </td>
                          <td>
                            {po.orderDate || po.createdAt
                              ? new Date((po.orderDate || po.createdAt) as string | number | Date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "N/A"}
                          </td>
                          <td>{po.productName || po.description || (po.items?.length ? `${po.items.length} Packs` : "Bulk Order")}</td>
                          <td style={{ fontWeight: 600 }}>₹{(po.totalAmount || po.grandTotal || po.amount || 0).toLocaleString()}</td>
                          <td>
                            <span className={styles.statusActive}>{po.status || "Completed"}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div style={{ padding: "24px", color: "#64748b", fontSize: "14px" }}>
                Customer reviews and seller feedbacks section.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
