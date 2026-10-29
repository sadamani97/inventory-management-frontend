import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import { fetchProductsPaginated, fetchProductsList, ProductItem } from "@/lib/dashboardApi";
import { ASSETS } from "@/constants/assets";
import styles from "@/styles/pages/products.module.css";
import { FiSearch, FiUpload, FiPlus } from "react-icons/fi";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";

const CATEGORY_OPTIONS: CustomSelectOption[] = [
  { label: "All Category", value: "All Category" },
  { label: "Dairy", value: "Dairy" },
  { label: "Beverages", value: "Beverages" },
  { label: "Snacks", value: "Snacks" },
  { label: "Grocery", value: "Grocery" },
  { label: "Cleaning", value: "Cleaning" },
  { label: "Personal Care", value: "Personal Care" },
];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [allProductsForExport, setAllProductsForExport] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    fetchProductsList().then((data) => setAllProductsForExport(data || []));
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      fetchProductsPaginated({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        categoryName: categoryFilter !== "All Category" ? categoryFilter : undefined,
      })
        .then((res) => {
          if (!isMounted) return;
          setProducts(res.data);
          setTotalItems(res.totalItems);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load products from backend:", err);
          if (isMounted) setLoading(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentPage, pageSize, search, categoryFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Top Header Row */}
        <div className={styles.topRow}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 className={styles.title}>Product Management</h1>
            {loading && <span className={styles.loadingSpinner} title="Loading products from backend..." />}
          </div>
          <div className={styles.actionsRight}>
            <button className={styles.exportBtn} onClick={() => setIsExportOpen(true)}>
              <FiUpload /> Export
            </button>
            <Link href="/products/add" className={styles.newProductBtn}>
              <FiPlus /> New Product
            </Link>
          </div>
        </div>

        {/* Card containing filters & table */}
        <div className={styles.tableCard}>
          <div className={styles.toolbar}>
            <div className={styles.leftFilters}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search Products by Name / SKU"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={styles.searchInput}
                />
                <FiSearch className={styles.searchIcon} />
              </div>

              <CustomDatePicker variant="blue" icon="chevron" />
            </div>

            <CustomSelect
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              width="140px"
            />
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className={styles.skeletonRow}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className={styles.skeletonBone} style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div className={styles.skeletonBone} style={{ width: "70%", height: 16, marginBottom: 6 }} />
                            <div className={styles.skeletonBone} style={{ width: "40%", height: 12 }} />
                          </div>
                        </div>
                      </td>
                      <td><div className={styles.skeletonBone} style={{ width: "60%" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "50%" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "45%" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "55%" }} /></td>
                    </tr>
                  ))
                ) : products.length > 0 ? (
                  products.map((p: ProductItem, idx: number) => {
                    const name = p.productName || "Product";
                    const vendor = p.vendor?.vendorName || p.vendor?.name || "No Vendor";
                    const sku = p.sku || `SKU-${idx + 1}`;
                    const category = p.category?.categoryName || "General";
                    const price = p.sellingPrice || 0;
                    const imageUrl = p.imageUrl || ASSETS.IMAGES.DASHBOARD_PRODUCT.src;

                    return (
                      <tr
                        key={p.id || idx}
                        onClick={() => p.id && router.push(`/products/add?id=${p.id}`)}
                        className={styles.productsElement2}
                      >
                        <td>
                          <div className={styles.productCell}>
                            <Image
                              src={imageUrl}
                              alt={name}
                              width={44}
                              height={44}
                              className={styles.productImg}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className={styles.productInfo}>
                              <p className={styles.productName}>{name}</p>
                              <p className={styles.productVendor}>{vendor}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.skuText}>{sku}</span>
                        </td>
                        <td>
                          <span className={styles.categoryTag}>{category}</span>
                        </td>
                        <td>
                          <span className={styles.priceText}>₹{Number(price).toLocaleString()}</span>
                        </td>
                        <td>
                          <span className={styles.timeText}>
                            {p.updatedAt ? "Updated recently" : "4 hrs ago"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.productsElement3}>
                      <p className={styles.productsElement4}>
                        No products stored in database.
                      </p>
                      <p className={styles.productsElement5}>
                        Click <strong>&quot;+ New Product&quot;</strong> to add products to your backend database.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>
      </div>
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Products"
        columns={["Product Name", "SKU", "Buying Price", "Selling Price", "Quantity"]}
        data={(allProductsForExport.length > 0 ? allProductsForExport : products).map(p => [
          p.productName || "Unnamed",
          p.sku || "N/A",
          `INR ${p.purchaseRate || 0}`,
          `INR ${p.sellingPrice || 0}`,
          `${p.quantity || 0} Packets`
        ])}
        filename="products_list"
      />
    </DashboardLayout>
  );
}
