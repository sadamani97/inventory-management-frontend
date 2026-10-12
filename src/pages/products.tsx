import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import { ProductItem } from "@/lib/dashboardApi";
import { APP_IMAGES } from "@/constants/images";
import styles from "@/styles/pages/products.module.css";
import { FiSearch, FiUpload, FiPlus } from "react-icons/fi";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductsThunk,
  setCurrentPage,
  setPageSize,
  setSearch,
  setCategoryFilter,
} from "@/store/productSlice";

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
  const dispatch = useAppDispatch();
  const {
    products,
    totalProducts,
    currentPage,
    pageSize,
    search,
    categoryFilter,
    loading,
  } = useAppSelector((state) => state.products);

  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch paginated products whenever page, pageSize, search or categoryFilter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchProductsThunk());
    }, search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, pageSize, categoryFilter, search]);

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Top Header Row */}
        <div className={styles.topRow}>
          <h1 className={styles.title}>Product Management</h1>
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
                  onChange={(e) => dispatch(setSearch(e.target.value))}
                  className={styles.searchInput}
                />
                <FiSearch className={styles.searchIcon} />
              </div>

              <CustomDatePicker variant="blue" icon="chevron" />
            </div>

            <CustomSelect
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={(val) => dispatch(setCategoryFilter(String(val)))}
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
                  <tr>
                    <td colSpan={5} className={styles.productsElement1}>
                      Loading products from backend database...
                    </td>
                  </tr>
                ) : products && products.length > 0 ? (
                  products.map((p: ProductItem, idx: number) => {
                    const name = p?.productName ?? "Product";
                    const vendor = p?.vendor?.vendorName ?? p?.vendor?.name ?? "No Vendor";
                    const sku = p?.sku ?? `SKU-${idx + 1}`;
                    const category = p?.category?.categoryName ?? "General";
                    const price = p?.sellingPrice ?? 0;
                    const imageUrl = p?.imageUrl || APP_IMAGES.DASHBOARD_PRODUCT.src;

                    return (
                      <tr
                        key={p?.id ?? idx}
                        onClick={() => p?.id && router.push(`/products/add?id=${p.id}`)}
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
                            {p?.updatedAt ? "Updated recently" : "4 hrs ago"}
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
            totalItems={totalProducts}
            pageSize={pageSize}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
            onPageSizeChange={(size) => dispatch(setPageSize(size))}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>
      </div>
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Products"
        columns={["Product Name", "SKU", "Buying Price", "Selling Price", "Quantity"]}
        data={products.map((p) => [
          p?.productName ?? "Unnamed",
          p?.sku ?? "N/A",
          `INR ${p?.purchaseRate ?? 0}`,
          `INR ${p?.sellingPrice ?? 0}`,
          `${p?.quantity ?? 0} Packets`,
        ])}
        filename="products_list"
      />
    </DashboardLayout>
  );
}
