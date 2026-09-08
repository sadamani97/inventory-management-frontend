import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchProductsList, ProductItem } from "@/lib/dashboardApi";
import styles from "@/styles/pages/products.module.css";
import { FiSearch, FiUpload, FiPlus, FiChevronDown } from "react-icons/fi";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchProductsList().then((data) => {
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        {/* Top Header Row */}
        <div className={styles.topRow}>
          <h1 className={styles.title}>Product Management</h1>
          <div className={styles.actionsRight}>
            <button className={styles.exportBtn}>
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
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
                <FiSearch className={styles.searchIcon} />
              </div>

              <div className={styles.datePill}>
                <span>11 Jun - 17 Jun 2026</span>
                <FiChevronDown />
              </div>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.categorySelect}
            >
              <option value="All Category">All Category</option>
              <option value="Dairy">Dairy</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Grocery">Grocery</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Personal Care">Personal Care</option>
            </select>
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
                    <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                      Loading products from backend database...
                    </td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p: ProductItem, idx: number) => {
                    const name = p.productName || "Product";
                    const vendor = "Supplier";
                    const sku = p.sku || `SKU-${idx + 1}`;
                    const category = p.category?.categoryName || "General";
                    const price = p.sellingPrice || 0;
                    const imageUrl = p.imageUrl || "/Frontend/Dashboard_product.png";

                    return (
                      <tr
                        key={p.id || idx}
                        onClick={() => p.id && router.push(`/products/add?id=${p.id}`)}
                        style={{ cursor: "pointer" }}
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
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#475569", margin: "0 0 6px 0" }}>
                        No products stored in database.
                      </p>
                      <p style={{ fontSize: "13px", margin: 0 }}>
                        Click <strong>"+ New Product"</strong> to add products to your backend database.
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
              <select className={styles.rowsSelect} defaultValue="10">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className={styles.pageControls}>
              <button className={styles.pageBtn} disabled>
                &lt; Previous
              </button>
              <button className={`${styles.pageBtn} ${styles.activePageBtn}`}>1</button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>Next &gt;</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
