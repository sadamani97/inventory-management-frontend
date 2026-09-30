import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  createProduct,
  updateProduct,
  fetchProductById,
  fetchCategories,
  createCategory,
  fetchVendorsList,
  fetchBrands,
  fetchUnits,
  CategoryItem,
  VendorItem,
  BrandItem,
} from "@/lib/dashboardApi";
import { toast } from "react-toastify";
import api from "@/lib/api";
import styles from "@/styles/pages/addProduct.module.css";
import { FiChevronLeft, FiImage, FiPlus, FiX, FiPackage, FiEdit } from "react-icons/fi";
import { showSuccessToast } from "@/components/ui/CustomToast";

export default function AddProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editId = router.query.id ? String(router.query.id) : "";
  const isEditMode = Boolean(editId);

  // Form State matching backend Product model attributes
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [vendorId, setVendorId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [purchaseRate, setPurchaseRate] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [lowStockLimit, setLowStockLimit] = useState<string>("");
  const [description, setDescription] = useState("");
  const [addVarient, setAddVarient] = useState<string>("");

  // Options Dropdowns State
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  // setUnits is intentionally removed to avoid unused vars, but we keep the fetch pattern if needed

  // UI Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch dropdown data on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchCategories(),
      fetchVendorsList(),
      fetchBrands(),
      fetchUnits(),
    ]).then(([cats, vends, brs]) => {
      if (!isMounted) return;
      setCategories(cats || []);
      setVendors(vends || []);
      setBrands(brs || []);
      // setUnits(uns || []);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load existing product details if editing
  useEffect(() => {
    if (!router.isReady || !editId) return;
    let isMounted = true;
    fetchProductById(editId).then((prod) => {
      if (!isMounted || !prod) return;
      setProductName(prod.productName || "");
      setSku(prod.sku || "");
      setBarcode(prod.barcode || "");
      if (prod.categoryId) setCategoryId(String(prod.categoryId));
      const foundVendorId = prod.vendorId || prod.vendor?.vendorId || prod.vendor?.id;
      if (foundVendorId) setVendorId(String(foundVendorId));
      if (prod.brand?.brandName) setBrandName(prod.brand.brandName);
      else if (prod.brandId) setBrandName(String(prod.brandId));
      if (prod.unitId) setUnitId(String(prod.unitId));
      if (prod.quantity !== undefined) setQuantity(String(prod.quantity));
      if (prod.purchaseRate !== undefined) setPurchaseRate(String(prod.purchaseRate));
      if (prod.sellingPrice !== undefined) setSellingPrice(String(prod.sellingPrice));
      if (prod.lowStockLimit !== undefined) setLowStockLimit(String(prod.lowStockLimit));
      if (prod.description) setDescription(prod.description);
      if (prod.addVarient) setAddVarient(prod.addVarient);
      if (prod.imageUrl) setImages([prod.imageUrl]);
    });

    return () => {
      isMounted = false;
    };
  }, [router.isReady, editId]);

  // Handler for adding a new category from the dropdown
  const handleAddNewCategory = async (newCatName: string): Promise<string | void> => {
    const res = await createCategory(newCatName);
    if (res && res.success && res.data) {
      const newCat = res.data;
      setCategories((prev) => [...prev, newCat]);
      const newId = String(newCat.categoryId || newCat.id);
      setCategoryId(newId);
      return newId;
    } else {
      const tempId = `temp-${Date.now()}`;
      const tempCat = { categoryId: tempId as unknown as number, categoryName: newCatName };
      setCategories((prev) => [...prev, tempCat]);
      setCategoryId(tempId);
      return tempId;
    }
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      try {
        const res = await api.post("/api/products/upload", { image: base64Image });
        if (res.data && res.data.imageUrl) {
          setImages((prev) => [...prev, res.data.imageUrl]);
        } else {
          setImages((prev) => [...prev, base64Image]);
        }
      } catch {
        setImages((prev) => [...prev, base64Image]);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!productName || productName.trim().length < 3) {
      const msg = "Product Name must be at least 3 characters long.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!vendorId) {
      const msg = "Please select a Vendor.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!categoryId) {
      const msg = "Please select a Category.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!sku || !sku.trim()) {
      const msg = "SKU is required.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        productName: productName.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || `BC-${Date.now()}`,
        categoryId: Number(categoryId) || 1,
        vendorId: Number(vendorId) || undefined,
        brandName: brandName.trim() || "Generic",
        purchaseRate: Math.max(0, Number(purchaseRate) || 0),
        sellingPrice: Math.max(0, Number(sellingPrice) || 0),
        quantity: Math.max(0, Number(quantity) || 0),
        lowStockLimit: Math.max(0, Number(lowStockLimit) || 10),
        unitId: Number(unitId) || 1,
        status: "Active" as const,
        description: description.trim() || `${productName} - SKU: ${sku}`,
        imageUrl: images[0] || "",
        addVarient: addVarient || "",
      };

      const result = isEditMode
        ? await updateProduct(editId, payload)
        : await createProduct(payload);

      if (result && result.success) {
        if (isEditMode) {
          showSuccessToast("Updated Product", "Product has been updated in your product list", <FiEdit size={44} color="#0f172a" strokeWidth={1.5} />);
        } else {
          showSuccessToast("Added New Product", "New Product will be added to your product list", <FiPackage size={44} color="#0f172a" strokeWidth={1.5} />);
        }
        setTimeout(() => {
          router.push("/products");
        }, 1200);
      } else {
        const errorDetail =
          typeof result?.error === "object"
            ? JSON.stringify(result.error)
            : result?.message || "Failed to save product.";
        const fullErr = `Backend Error: ${errorDetail}`;
        setErrorMsg(fullErr);
        toast.error(fullErr);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const fullErr = message || "Network Error: Unable to reach backend API endpoint.";
      setErrorMsg(fullErr);
      toast.error(fullErr);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        <div className={styles.navHeader}>
          <Link href="/products" className={styles.backBtn} aria-label="Back">
            <FiChevronLeft />
          </Link>
          <div className={styles.headerCopy}>
            <span className={styles.backSubtitle}>Back to product list</span>
            <h1 className={styles.pageTitle}>{isEditMode ? "Edit Product" : "Add Product"}</h1>
          </div>
        </div>

        {errorMsg ? <div className={styles.errorBanner}>{errorMsg}</div> : null}
        {successMsg ? <div className={styles.successBanner}>{successMsg}</div> : null}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.leftColumn}>
            <div className={`${styles.card} ${styles.highlightCard}`}>
              <h3 className={styles.cardTitle}>Basic information</h3>
              <div className={styles.inputGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Product Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    required
                    className={styles.inputControl}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Vendor <span className={styles.required}>*</span>
                  </label>
                  <CustomSelect
                    options={vendors.map((v) => ({
                      label: String(v.vendorName || v.name || "Vendor"),
                      value: String(v.vendorId || v.id || ""),
                    }))}
                    value={vendorId}
                    onChange={setVendorId}
                    placeholder="Select Vendor"
                    width="100%"
                    height="42px"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Category <span className={styles.required}>*</span>
                  </label>
                  <CustomSelect
                    options={categories.map((c) => ({
                      label: String(c.categoryName || c.name || "Category"),
                      value: String(c.categoryId || c.id || ""),
                    }))}
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Select Category"
                    onAddNew={handleAddNewCategory}
                    addNewButtonText="+ Add new category"
                    addNewPlaceholder="Enter new category"
                    width="100%"
                    height="42px"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Brand <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    list="brandOptions"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Enter or select brand"
                    required
                    className={styles.inputControl}
                  />
                  <datalist id="brandOptions">
                    {brands.map((b, idx) => (
                      <option key={b.brandId || b.id || idx} value={b.brandName || b.name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Inventory</h3>
              <div className={styles.inputGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className={styles.inputControl}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    SKU <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Enter SKU e.g. PROD-001"
                    required
                    className={styles.inputControl}
                  />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Pricing</h3>
              <div className={styles.inputGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(e.target.value)}
                    placeholder="0.00"
                    className={styles.inputControl}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className={styles.inputControl}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Product image</h3>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
               className={styles.addElement1} />

              <div className={styles.dropzoneGrid}>
                <div
                  className={styles.dropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiImage className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    <span className={styles.uploadLink}>Click to upload</span> or drag and drop
                  </p>
                </div>

                {images.map((imgSrc, idx) => (
                  <div key={idx} className={styles.addElement2}>
                    <Image
                      src={imgSrc}
                      alt="Uploaded preview"
                      width={100}
                      height={100}
                      unoptimized
                      className={styles.previewImg}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className={styles.removeImgBtn}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Variant</h3>
              <div className={styles.variantBox}>
                <span className={styles.variantLabel}>Product variant</span>
                <button
                  type="button"
                  onClick={() => setAddVarient("Standard 1L")}
                  className={styles.addVariantBtn}
                >
                  <FiPlus /> Add variant
                </button>
              </div>
              {addVarient ? (
                <div className={styles.addElement3}>
                  Selected variant: {addVarient}
                </div>
              ) : null}
            </div>

            <div className={styles.actionsRow}>
              <Link href="/products" className={styles.discardBtn}>
                Discard
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
