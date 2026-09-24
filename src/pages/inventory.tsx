import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import {
  fetchProductsList,
  fetchProductStats,
  ProductItem,
  ProductStatsResponse,
  CategoryItem,
  fetchCategories,
  fetchStockFlowChartData,
  StockFlowItem,
  VendorItem,
  fetchVendorsList,
  updateProduct,
  recordReorderActivity,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/inventory.module.css";
import {
  FiSearch,
  FiUpload,
  FiPlus,
  FiMinus,
  FiMoreVertical,
  FiSend,
  FiRotateCw,
  FiX,
  FiBookmark,
} from "react-icons/fi";

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stats, setStats] = useState<ProductStatsResponse>({
    totalProducts: 0,
    addedThisMonth: 0,
    activeStock: 0,
    lowStock: 0,
    outOfStock: 0,
    unitsRestockedThisMonth: 0,
  });
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [stockFlowData, setStockFlowData] = useState<StockFlowItem[]>([]);
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(4); // default hover index
  const [daysFilter, setDaysFilter] = useState("Last 10 days");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [loading, setLoading] = useState(true);

  // Modal State for "Create Reorder" drawer/modal
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [reorderVendor, setReorderVendor] = useState("");
  const [reorderDeliveryTo, setReorderDeliveryTo] = useState("Silkmill");
  const [reorderQty, setReorderQty] = useState(82);
  const [reorderUnitCost, setReorderUnitCost] = useState(160);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [reorderNote, setReorderNote] = useState("Please include packing slip. Delivery between 9 AM - 5 PM");

  // Modal State for "Placing Order" success confirmation toast
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderVendorName, setOrderVendorName] = useState("");

  // Action Menu Popover State (90px x 58px)
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | string | null>(null);

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

  const getDaysCount = (filterVal: string) => {
    switch (filterVal) {
      case "Last 5 days":
        return 5;
      case "Last 30 days":
        return 30;
      case "Last 10 days":
      default:
        return 10;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const daysNum = getDaysCount(daysFilter);

    Promise.all([
      fetchProductsList(),
      fetchProductStats(),
      fetchCategories(),
      fetchVendorsList(),
      fetchStockFlowChartData(daysNum),
    ]).then(([prodsData, statsData, catsData, vendorsData, flowData]) => {
      if (!isMounted) return;
      setProducts(prodsData || []);
      setStats(
        statsData || {
          totalProducts: 0,
          addedThisMonth: 0,
          activeStock: 0,
          lowStock: 0,
          outOfStock: 0,
          unitsRestockedThisMonth: 0,
        }
      );
      setCategories(catsData || []);
      setVendors(vendorsData || []);
      setStockFlowData(flowData || []);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [daysFilter]);

  const handleDaysFilterChange = (val: string) => {
    setDaysFilter(val);
    fetchStockFlowChartData(getDaysCount(val)).then((flowData) => {
      setStockFlowData(flowData || []);
    });
  };

  // Open Reorder Modal prefilled with product and its last ordered quantity
  const openReorderModal = (prod?: ProductItem) => {
    const target = prod || (products.length > 0 ? products[0] : null);
    setSelectedProduct(target);

    const defaultVendor = target?.vendor?.vendorName || (vendors.length > 0 ? String(vendors[0].vendorName || vendors[0].name) : "");
    setReorderVendor(defaultVendor);
    setReorderDeliveryTo("Silkmill");

    // Retrieve last ordered quantity stored for this product in localStorage
    let lastQty = 82;
    if (target && target.id && typeof window !== "undefined") {
      try {
        const storedMap = JSON.parse(localStorage.getItem("last_reordered_quantities") || "{}");
        if (storedMap[target.id]) {
          lastQty = Number(storedMap[target.id]);
        } else {
          const inStock = target.quantity ?? 0;
          lastQty = inStock < 100 ? Math.max(10, 100 - inStock) : 82;
        }
      } catch (err) {}
    } else if (target) {
      const inStock = target.quantity ?? 0;
      lastQty = inStock < 100 ? Math.max(10, 100 - inStock) : 82;
    }

    setReorderQty(lastQty);

    const cost = target?.purchaseRate || target?.sellingPrice || 160;
    setReorderUnitCost(cost);

    setShowReorderModal(true);
  };

  const handleProductSelect = (productNameVal: string) => {
    const matched = products.find((p) => (p.productName || "") === productNameVal);
    if (matched) {
      setSelectedProduct(matched);
      const vName = matched.vendor?.vendorName || (vendors.length > 0 ? String(vendors[0].vendorName || vendors[0].name) : reorderVendor);
      if (vName) setReorderVendor(vName);

      let lastQty = 82;
      if (matched.id && typeof window !== "undefined") {
        try {
          const storedMap = JSON.parse(localStorage.getItem("last_reordered_quantities") || "{}");
          if (storedMap[matched.id]) {
            lastQty = Number(storedMap[matched.id]);
          } else {
            const inStock = matched.quantity ?? 0;
            lastQty = inStock < 100 ? Math.max(10, 100 - inStock) : 82;
          }
        } catch (err) {}
      }
      setReorderQty(lastQty);

      const cost = matched.purchaseRate || matched.sellingPrice || reorderUnitCost;
      setReorderUnitCost(cost);
    }
  };

  const handleSubmitOrder = async () => {
    const targetVendor = reorderVendor || selectedProduct?.vendor?.vendorName || "Vendor";

    if (selectedProduct && selectedProduct.id) {
      const currentQty = selectedProduct.quantity ?? 0;
      const newQty = currentQty + (reorderQty || 0);

      // Save last ordered quantity for this product in localStorage
      if (typeof window !== "undefined") {
        try {
          const storedMap = JSON.parse(localStorage.getItem("last_reordered_quantities") || "{}");
          storedMap[selectedProduct.id] = reorderQty;
          localStorage.setItem("last_reordered_quantities", JSON.stringify(storedMap));
        } catch (err) {}
      }

      // 1. Update product quantity in database
      await updateProduct(selectedProduct.id, {
        quantity: newQty,
        purchaseRate: reorderUnitCost || selectedProduct.purchaseRate,
      });

      // 2. Save reorder event into recent activity log
      recordReorderActivity(selectedProduct, reorderQty);

      // 3. Refresh product list, stat counts, and stock flow chart from database
      const daysNum = getDaysCount(daysFilter);
      const [prodsData, statsData, flowData] = await Promise.all([
        fetchProductsList(),
        fetchProductStats(),
        fetchStockFlowChartData(daysNum),
      ]);
      if (prodsData) setProducts(prodsData);
      if (statsData) setStats(statsData);
      if (flowData) setStockFlowData(flowData);
    }

    setOrderVendorName(targetVendor);
    setShowReorderModal(false);
    setShowOrderModal(true);
  };

  // Calculations for Summary Box
  const subtotal = (reorderQty || 0) * (reorderUnitCost || 0);
  const total = subtotal;

  const formatDateDDMMYYYY = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd} - ${mm} - ${yyyy}`;
  };

  // Filter products by Search input & Category dropdown
  const filteredProducts = products.filter((p: ProductItem) => {
    const pName = (p.productName || "").toLowerCase();
    const pSku = (p.sku || "").toLowerCase();
    const matchesSearch =
      pName.includes(search.toLowerCase()) || pSku.includes(search.toLowerCase());

    const catName = p.category?.categoryName || "";
    const matchesCategory =
      categoryFilter === "All Category" ||
      catName.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Calculate dynamic Stock Info stats strictly from live Database products
  const activeProductsCount = stats.totalProducts || products.length;
  const highStockCount = products.filter((p) => (p.quantity ?? 0) > 20).length;
  const lowStockCount = products.filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) <= 20).length;
  const outOfStockCount = products.filter((p) => (p.quantity ?? 0) <= 0).length;

  // Max value for stock bars height percentage computation
  const maxStockVal = Math.max(highStockCount, lowStockCount, outOfStockCount, 1);

  // Build category options dynamically from backend Database Categories
  const categoryOptions: CustomSelectOption[] = [
    { label: "All Category", value: "All Category" },
    ...categories.map((c) => ({
      label: String(c.categoryName || c.name || ""),
      value: String(c.categoryName || c.name || ""),
    })),
  ];

  const chartDataToRender = stockFlowData;
  const maxChartVal = Math.max(
    ...chartDataToRender.map((d) => (d.stockAdded || 0) + (d.stockSold || 0)),
    100
  );

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Top Header Row */}
        <div className={styles.topRow}>
          <h1 className={styles.title}>Inventory Tracking</h1>
          <div className={styles.actionsRight}>
            <button type="button" className={styles.exportBtn}>
              <FiUpload /> Export
            </button>
            <button type="button" className={styles.reorderPrimaryBtn} onClick={() => openReorderModal()}>
              <FiPlus /> Reorder
            </button>
          </div>
        </div>

        {/* Top Cards Grid: Stock flow chart + Stock info stats */}
        <div className={styles.topCardsGrid}>
          {/* Stock Flow Card */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitle}>Stock flow</h3>
              <div className={styles.cardLegend}>
                <span>
                  <span className={styles.dotAdded}></span> Stock Added
                </span>
                <span>
                  <span className={styles.dotSold}></span> Stock Sold
                </span>
                <CustomSelect
                  options={[
                    { label: "Last 5 days", value: "Last 5 days" },
                    { label: "Last 10 days", value: "Last 10 days" },
                    { label: "Last 30 days", value: "Last 30 days" },
                  ]}
                  value={daysFilter}
                  onChange={handleDaysFilterChange}
                  width="130px"
                  height="32px"
                />
              </div>
            </div>

            <div className={styles.chartContainer}>
              {chartDataToRender.length === 0 ? (
                <div className={styles.emptyChartBox}>
                  <p>No stock flow data available</p>
                </div>
              ) : (
                <svg viewBox="0 0 540 160" width="100%" height="100%" preserveAspectRatio="none">
                  {/* Horizontal Grid lines */}
                  {[20, 55, 90, 125].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="540"
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray="3 3"
                    />
                  ))}

                  {/* Bars */}
                  {chartDataToRender.map((item, idx) => {
                    const totalDays = Math.max(chartDataToRender.length, 1);
                    const barWidth = totalDays <= 5 ? 32 : totalDays <= 10 ? 20 : 10;
                    const step = 540 / totalDays;
                    const x = idx * step + (step - barWidth) / 2;

                    const totalVal = (item.stockAdded || 0) + (item.stockSold || 0);
                    // Max height for stacked bar is 85px to stay cleanly below header grid lines
                    const maxBarH = 85;
                    const totalH = totalVal > 0 ? Math.max(12, Math.round((totalVal / maxChartVal) * maxBarH)) : 0;
                    const addedHeight = totalVal > 0 ? Math.round(((item.stockAdded || 0) / totalVal) * totalH) : 0;
                    const soldHeight = Math.max(0, totalH - addedHeight);

                    const baselineY = 125;
                    const yAdded = baselineY - addedHeight;
                    const ySold = yAdded - soldHeight;
                    const isHighlight = activeHoverIdx === idx;

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setActiveHoverIdx(idx)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Stock Added (Blue at bottom) */}
                        {addedHeight > 0 && (
                          <rect
                            x={x}
                            y={yAdded}
                            width={barWidth}
                            height={addedHeight}
                            fill={isHighlight ? "#93c5fd" : "#e5e7eb"}
                            rx={0}
                          />
                        )}
                        {/* Stock Sold (Soft Red Stacked on top) */}
                        {soldHeight > 0 && (
                          <rect
                            x={x}
                            y={ySold}
                            width={barWidth}
                            height={soldHeight}
                            fill={isHighlight ? "#f87171" : "#d1d5db"}
                            rx={0}
                          />
                        )}
                        {/* Divider line between stacked sections */}
                        {isHighlight && addedHeight > 0 && soldHeight > 0 && (
                          <line
                            x1={x}
                            y1={yAdded}
                            x2={x + barWidth}
                            y2={yAdded}
                            stroke="#2563eb"
                            strokeWidth="1.5"
                          />
                        )}
                        {/* Tooltip on Bar Hover */}
                        {isHighlight && (
                          <g transform={`translate(${Math.max(5, Math.min(x - 25, 430))}, ${Math.max(ySold - 44, 2)})`}>
                            <rect
                              width="100"
                              height="38"
                              rx="5"
                              fill="#ffffff"
                              stroke="#cbd5e1"
                              filter="drop-shadow(0px 2px 6px rgba(0,0,0,0.08))"
                            />
                            <circle cx="10" cy="14" r="3" fill="#93c5fd" />
                            <text x="18" y="17" fontSize="9" fontWeight="600" fill="#475569">
                              Stock Added:
                            </text>
                            <text x="92" y="17" fontSize="9" fontWeight="700" fill="#0f172a" textAnchor="end">
                              {item.stockAdded.toLocaleString()}
                            </text>

                            <circle cx="10" cy="27" r="3" fill="#f87171" />
                            <text x="18" y="30" fontSize="9" fontWeight="600" fill="#475569">
                              Stock Sold:
                            </text>
                            <text x="92" y="30" fontSize="9" fontWeight="700" fill="#0f172a" textAnchor="end">
                              {item.stockSold.toLocaleString()}
                            </text>
                          </g>
                        )}
                        {/* X Axis Day Label */}
                        <text
                          x={x + barWidth / 2}
                          y={145}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={isHighlight ? "800" : "500"}
                          fill={isHighlight ? "#0f172a" : "#64748b"}
                        >
                          {item.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Stock Info Card (Exact Figma Horizontal Layout) */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitle}>Stock info</h3>
            </div>
            <div className={styles.stockInfoHorizontalLayout}>
              {/* Active Products Left Column */}
              <div className={styles.activeProductsColumn}>
                <p className={styles.activeLabel}>Active products</p>
                <p className={styles.activeValue}>{activeProductsCount}</p>
              </div>

              {/* Horizontal Bars Section with Vertical Dashed Dividers */}
              <div className={styles.stockBarsHorizontalGrid}>
                {/* High Stock Column */}
                <div className={styles.stockColItem}>
                  <div className={styles.stockColHeader}>
                    <span className={styles.stockColLabel}>High stock</span>
                    <span className={styles.stockColVal}>{highStockCount}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFillGreen}
                      style={{ height: `${Math.min(100, Math.max(25, (highStockCount / maxStockVal) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Low Stock Column */}
                <div className={styles.stockColItem}>
                  <div className={styles.stockColHeader}>
                    <span className={styles.stockColLabel}>low stock</span>
                    <span className={styles.stockColVal}>{lowStockCount}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFillYellow}
                      style={{ height: `${Math.min(100, Math.max(25, (lowStockCount / maxStockVal) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Out of Stock Column */}
                <div className={styles.stockColItem}>
                  <div className={styles.stockColHeader}>
                    <span className={styles.stockColLabel}>Out of stock</span>
                    <span className={styles.stockColVal}>{outOfStockCount}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFillRed}
                      style={{ height: `${Math.min(100, Math.max(25, (outOfStockCount / maxStockVal) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Logs Section */}
        <div className={styles.tableCard}>
          <div className={styles.logsHeader}>
            <h3 className={styles.cardTitle}>Inventory logs</h3>
            <button className={styles.exportBtn}>
              <FiUpload /> Export
            </button>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.leftFilters}>
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

              <CustomDatePicker variant="blue" icon="chevron" />
            </div>

            <CustomSelect
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              width="150px"
            />
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Product name</th>
                  <th style={{ textAlign: "left" }}>SKU</th>
                  <th style={{ textAlign: "left" }}>Category</th>
                  <th style={{ textAlign: "left" }}>Current Stock</th>
                  <th style={{ textAlign: "right", paddingRight: "28px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                      Loading inventory items from backend database...
                    </td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p: ProductItem, idx: number) => {
                    const name = p.productName || "-";
                    const sku = p.sku || "-";
                    const category = p.category?.categoryName || "-";
                    const qty = p.quantity ?? 0;
                    const imageUrl = p.imageUrl || "/Frontend/Dashboard_product.png";

                    // Determine stock status & progress bar percentage
                    let statusLabel = "High";
                    let statusClass = styles.statusHigh;
                    let fillClass = styles.progressFillHigh;
                    let fillPct = Math.min(100, Math.max(10, (qty / 100) * 100));

                    if (qty <= 0) {
                      statusLabel = "Out of stock";
                      statusClass = styles.statusOut;
                      fillClass = styles.progressFillOut;
                      fillPct = 5;
                    } else if (qty <= 20) {
                      statusLabel = "Low";
                      statusClass = styles.statusLow;
                      fillClass = styles.progressFillLow;
                      fillPct = Math.min(60, Math.max(15, (qty / 20) * 50));
                    }

                    return (
                      <tr
                        key={p.id || idx}
                        onClick={() => p.id && router.push(`/products/add?id=${p.id}`)}
                        style={{ cursor: "pointer" }}
                        title="Click to view/edit product details"
                      >
                        <td>
                          <div className={styles.productCell}>
                            <Image
                              src={imageUrl}
                              alt={name}
                              width={36}
                              height={36}
                              className={styles.productImg}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <span className={styles.productName}>{name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.skuText}>{sku}</span>
                        </td>
                        <td>
                          <span className={styles.categoryTag}>{category}</span>
                        </td>
                        <td>
                          <div className={styles.stockProgressWrapper}>
                            <div className={styles.stockBadgeRow}>
                              <span>{qty} unit</span>
                              <span className={statusClass}>- {statusLabel}</span>
                            </div>
                            <div className={styles.progressBarBg}>
                              <div
                                className={fillClass}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={styles.actionCell}>
                          <button
                            className={styles.actionMenuBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rowKey = p.id || idx;
                              setActiveActionMenuId(activeActionMenuId === rowKey ? null : rowKey);
                            }}
                            title="Action options"
                          >
                            <FiMoreVertical />
                          </button>

                          {activeActionMenuId === (p.id || idx) && (
                            <div
                              className={styles.actionPopover}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className={styles.popoverItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                  if (p.id) router.push(`/products/add?id=${p.id}`);
                                }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className={styles.popoverItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                  openReorderModal(p);
                                }}
                              >
                                Reorder
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#475569", margin: "0 0 6px 0" }}>
                        No inventory records found.
                      </p>
                      <p style={{ fontSize: "13px", margin: 0 }}>
                        Products added to the backend database will automatically display here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className={styles.paginationRow}>
            <div className={styles.rowsPerPage}>
              <span>Rows per page</span>
              <CustomSelect
                options={[
                  { label: "10", value: "10" },
                  { label: "25", value: "25" },
                  { label: "50", value: "50" },
                ]}
                value="10"
                onChange={() => {}}
                width="70px"
                height="32px"
              />
            </div>

            <div className={styles.pageControls}>
              <button className={styles.pageBtn} disabled>
                &lt; Previous
              </button>
              <button className={`${styles.pageBtn} ${styles.activePageBtn}`}>1</button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>3</button>
              <button className={styles.pageBtn}>Next &gt;</button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Reorder Modal */}
      {showReorderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReorderModal(false)}>
          <div className={styles.reorderModalBox} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.reorderModalHeader}>
              <div className={styles.reorderHeaderLeft}>
                <div className={styles.reorderIconCircle}>
                  <FiRotateCw />
                </div>
                <div>
                  <h2 className={styles.reorderTitle}>Create Reorder</h2>
                  <p className={styles.reorderSubtitle}>
                    Effortlessly import products and update your inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeIconBtn}
                onClick={() => setShowReorderModal(false)}
              >
                <FiX />
              </button>
            </div>

            {/* Product Card Preview */}
            {selectedProduct ? (
              <div className={styles.productPreviewCard}>
                <div className={styles.productPreviewLeft}>
                  <Image
                    src={selectedProduct.imageUrl || "/Frontend/Dashboard_product.png"}
                    alt={selectedProduct.productName || "Product"}
                    width={48}
                    height={48}
                    className={styles.productPreviewImg}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div>
                    <p className={styles.productPreviewName}>{selectedProduct.productName || "Product"}</p>
                    <p className={styles.productPreviewSku}>{selectedProduct.sku || "-"}</p>
                    <p className={styles.productPreviewCat}>
                      {selectedProduct.category?.categoryName || "Category"}
                    </p>
                  </div>
                </div>

                <div className={styles.productBadgesRight}>
                  <span className={styles.badgeInStock}>
                    In Stock: {selectedProduct.quantity ?? 0}
                  </span>
                  <span className={styles.badgeReorder}>
                    Reorder: {reorderQty}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Form Fields Grid */}
            <div className={styles.reorderFormGrid}>
              {/* Select Product */}
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.formLabel}>Select Product</label>
                <CustomSelect
                  options={products.map((p) => ({
                    label: p.productName || "Product",
                    value: p.productName || "Product",
                  }))}
                  value={selectedProduct?.productName || ""}
                  onChange={handleProductSelect}
                  placeholder="Select Product to Reorder"
                />
              </div>

              {/* Vendor */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vendor</label>
                <CustomSelect
                  options={
                    vendors.length > 0
                      ? vendors.map((v) => ({
                          label: String(v.vendorName || v.name || "Vendor"),
                          value: String(v.vendorName || v.name || "Vendor"),
                        }))
                      : [{ label: "Fresh Farm suppliers", value: "Fresh Farm suppliers" }]
                  }
                  value={reorderVendor}
                  onChange={setReorderVendor}
                  placeholder="Select Vendor"
                />
              </div>

              {/* Delivery To */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Delivery to</label>
                <CustomSelect
                  options={[
                    { label: "Silkmill", value: "Silkmill" },
                    { label: "Main Store", value: "Main Store" },
                    { label: "Central Warehouse", value: "Central Warehouse" },
                  ]}
                  value={reorderDeliveryTo}
                  onChange={setReorderDeliveryTo}
                />
              </div>

              {/* Quantity to order */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantity to order</label>
                <div className={styles.stepperBox}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => setReorderQty((prev) => Math.max(1, prev - 1))}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    value={reorderQty}
                    onChange={(e) => setReorderQty(Math.max(1, Number(e.target.value) || 1))}
                    className={styles.stepperInput}
                  />
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => setReorderQty((prev) => prev + 1)}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Unit Cost */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Unit Cost</label>
                <input
                  type="text"
                  value={`₹${reorderUnitCost}`}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                    setReorderUnitCost(Number(rawVal) || 0);
                  }}
                  className={styles.costInput}
                />
              </div>

              {/* Order Date */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Order date</label>
                <CustomDatePicker
                  value={orderDate}
                  onChange={setOrderDate}
                  icon="calendar"
                  formatLabel={formatDateDDMMYYYY}
                />
              </div>

              {/* Expected Delivery Date */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expected Delivery</label>
                <CustomDatePicker
                  value={expectedDeliveryDate}
                  onChange={setExpectedDeliveryDate}
                  icon="calendar"
                  formatLabel={formatDateDDMMYYYY}
                />
              </div>

              {/* Note (Full Width) */}
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.formLabel}>Note</label>
                <textarea
                  value={reorderNote}
                  onChange={(e) => setReorderNote(e.target.value)}
                  className={styles.noteTextarea}
                  placeholder="Please include packing slip..."
                />
              </div>
            </div>

            {/* Summary Box */}
            <div className={styles.summaryBox}>
              <h4 className={styles.summaryTitle}>Summary</h4>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Quantity</span>
                <span className={styles.summaryVal}>{reorderQty} Units</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Unit Cost</span>
                <span className={styles.summaryVal}>
                  ₹{Number(reorderUnitCost).toFixed(2)}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryVal}>
                  ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <hr className={styles.summaryDivider} />
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel} style={{ fontWeight: 700, color: "#0f172a" }}>
                  Total
                </span>
                <span className={styles.summaryVal} style={{ fontSize: "15px", color: "#0f172a" }}>
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Footer Row */}
            <div className={styles.modalFooterRow}>
              <button
                type="button"
                className={styles.saveDraftBtn}
                onClick={() => setShowReorderModal(false)}
              >
                <FiBookmark /> Save draft
              </button>

              <div className={styles.rightBtnGroup}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setShowReorderModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.submitOrderBtn}
                  onClick={handleSubmitOrder}
                >
                  Submit order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placing Order Confirmation Modal (Matching Figma overlay) */}
      {showOrderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowOrderModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <FiSend />
            </div>
            <h2 className={styles.modalTitle}>Placing Order</h2>
            <p className={styles.modalText}>
              Your order has been sent to <strong>{orderVendorName || "Vendor"}</strong>
            </p>
            <button
              className={styles.modalCloseBtn}
              onClick={() => setShowOrderModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
