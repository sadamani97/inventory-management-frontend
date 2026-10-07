import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { FiX, FiSearch, FiTrash2, FiFileText, FiUploadCloud } from "react-icons/fi";
import { fetchProductsList, ProductItem, createSalesOrder, SalesOrderItem } from "@/lib/dashboardApi";
import CustomSelect from "@/components/ui/CustomSelect";
import ExportDialog from "@/components/ui/ExportDialog";
import styles from "@/styles/components/salesOrderModal.module.css";
import { toast } from "react-toastify";
import { APP_IMAGES } from "@/constants/images";

export type SalesOrderMode = "create" | "edit" | "view";

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: SalesOrderMode;
  order?: SalesOrderItem | null;
}

export default function SalesOrderModal({ isOpen, onClose, onSuccess, mode, order }: SalesOrderModalProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  
  // Form Data
  const [soNumber, setSoNumber] = useState("");
  const [customerType, setCustomerType] = useState("Walk In Customer");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<(ProductItem & { qty: number })[]>([]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [localDraftId, setLocalDraftId] = useState<number | string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProductsList().then(data => setProducts(data || []));
      
      if (mode === "create") {
        setTimeout(() => {
          const lastSeq = parseInt(localStorage.getItem("lastSoNumber") || "10241", 10);
          setSoNumber(`SO-${lastSeq + 1}`);
          setCustomerType("Walk In Customer");
          setCustomerName("");
          setPhone("");
          setOrderItems([]);
          setPaymentMode("Cash");
          setLocalDraftId(null);
        }, 0);
      } else if (order) {
        setTimeout(() => {
          const extOrder = order as SalesOrderItem & { 
            phone?: string; 
            paymentMode?: string; 
            isDraft?: boolean; 
            items?: { productId?: number; productName?: string; quantity?: number; unitPrice?: number }[] 
          };
          setSoNumber(extOrder.orderNumber || extOrder.soNumber || "");
          setCustomerType(extOrder.customerType || "Walk In Customer");
          setCustomerName(extOrder.customerName || "");
          setPhone(extOrder.phone || "");
          setPaymentMode(extOrder.paymentMode || "Cash");
          setLocalDraftId(extOrder.isDraft ? extOrder.id : null);
          
          // Map items if any
          if (extOrder.items && Array.isArray(extOrder.items)) {
            // Just mock mapping since full product details might not be in order.items
            const mapped = extOrder.items.map((it: { productId?: number; productName?: string; quantity?: number; unitPrice?: number }, idx: number) => ({
              id: it.productId || idx,
              productName: it.productName || "Product",
              quantity: it.quantity || 1, // mapping product quantity to stock for UI
              qty: it.quantity || 1,
              sellingPrice: it.unitPrice || 0,
              imageUrl: "",
              sku: `SKU-${idx}`
            })) as (ProductItem & { qty: number })[];
            setOrderItems(mapped);
          } else {
            setOrderItems([]);
          }
        }, 0);
      }
    }
  }, [isOpen, mode, order]);

  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (Number(item.sellingPrice || item.purchaseRate || 0) * item.qty), 0);
  }, [orderItems]);

  const discount = 0; // Keeping 0 for now as per UI
  const totalAmount = subtotal - discount;

  if (!isOpen) return null;

  const handleProductSelect = (product: ProductItem) => {
    const stock = Number(product.quantity || 0);
    if (stock < 1) {
      toast.warning("Product is out of stock");
      setSearchQuery("");
      return;
    }
    if (!orderItems.find(item => item.id === product.id)) {
      setOrderItems([...orderItems, { ...product, qty: 1 }]);
    }
    setSearchQuery("");
  };

  const updateItemQty = (id: number | undefined, val: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const maxQty = Number(item.quantity || 0);
        let newQty = Math.max(1, val);
        if (newQty > maxQty) {
          toast.warning(`Only ${maxQty} units available in stock`);
          newQty = maxQty;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: number | undefined) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const saveToLocalDraft = () => {
    if (!soNumber) {
      toast.error("SO number is required");
      return;
    }

    const draftOrder = {
      id: localDraftId || `draft-${Date.now()}`,
      soNumber,
      orderNumber: soNumber,
      customerType,
      customerName,
      phone,
      paymentMode,
      status: "Draft",
      isDraft: true,
      createdAt: new Date().toISOString(),
      orderDate: new Date().toISOString(),
      totalAmount,
      items: orderItems.map(it => ({
        productId: Number(it.id),
        productName: it.productName,
        quantity: it.qty,
        unitPrice: Number(it.sellingPrice || it.purchaseRate || 0)
      }))
    };

    const existingDrafts = JSON.parse(localStorage.getItem("draftSalesOrders") || "[]");
    
    if (localDraftId) {
      const idx = existingDrafts.findIndex((d: { id: string | number }) => d.id === localDraftId);
      if (idx !== -1) existingDrafts[idx] = draftOrder;
      else existingDrafts.push(draftOrder);
    } else {
      existingDrafts.push(draftOrder);
    }

    localStorage.setItem("draftSalesOrders", JSON.stringify(existingDrafts));
    
    const currentNumStr = soNumber.replace(/[^0-9]/g, '');
    const currentNum = parseInt(currentNumStr, 10);
    if (!isNaN(currentNum)) {
      const lastSeq = parseInt(localStorage.getItem("lastSoNumber") || "10241", 10);
      if (currentNum > lastSeq) {
        localStorage.setItem("lastSoNumber", String(currentNum));
      }
    }
    toast.success("Saved as draft");
    onSuccess?.();
    onClose();
  };

  const removeDraft = (id: string | number) => {
    const existingDrafts = JSON.parse(localStorage.getItem("draftSalesOrders") || "[]");
    const updated = existingDrafts.filter((d: { id: string | number }) => d.id !== id);
    localStorage.setItem("draftSalesOrders", JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    if (!soNumber) {
      toast.error("SO number is required.");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const payload: import("@/lib/dashboardApi").CreateSalesOrderPayload = {
      orderNumber: soNumber,
      customerType,
      paymentMode,
      status: "Paid",
      subtotal,
      discountAmount: discount,
      totalAmount,
      items: orderItems.map(item => ({
        productId: Number(item.id),
        productName: item.productName,
        quantity: item.qty,
        unitPrice: Number(item.sellingPrice || item.purchaseRate || 0)
      }))
    };

    if (customerName) payload.customerName = customerName;
    if (phone) payload.phone = phone;

    const res = await createSalesOrder(payload);
    if (res?.success) {
      toast.success("Sales Order completed successfully");
      const currentNumStr = soNumber.replace(/[^0-9]/g, '');
      const currentNum = parseInt(currentNumStr, 10);
      if (!isNaN(currentNum)) {
        const lastSeq = parseInt(localStorage.getItem("lastSoNumber") || "10241", 10);
        if (currentNum > lastSeq) {
          localStorage.setItem("lastSoNumber", String(currentNum));
        }
      }
      if (localDraftId) {
        removeDraft(localDraftId);
      }
      onSuccess?.();
      onClose();
    }
  };

  const customerTypeOptions = [
    { label: "Walk In Customer", value: "Walk In Customer" },
    { label: "Retail Customer", value: "Retail Customer" },
    { label: "Wholesale Customer", value: "Wholesale Customer" }
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Header (Top Level) */}
        <div className={styles.modalHeaderTop}>
          <h2 className={styles.modalHeaderTitle}>Sales Order Details</h2>
          <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>

        {/* Order Info Block */}
        <div className={styles.orderInfoBlock}>
          <div className={styles.orderInfoLeft}>
            <div className={styles.headerIcon}>
              <Image {...APP_IMAGES.ORDER_PAGE_LOGO} alt="Order Logo" />
            </div>
            <div className={styles.orderInfoDetails}>
              <div className={styles.orderInfoTitleRow}>
                <h3 className={styles.orderInfoTitle}>{soNumber}</h3>
                {order?.status?.toLowerCase() === "draft" || mode === "edit" || mode === "create" ? (
                  <span className={styles.badgeDraft}>Draft</span>
                ) : (
                  <span className={`${styles.badgeDraft} ${styles.badgePaid}`}>Paid</span>
                )}
              </div>
              <span className={styles.paymentText}>
                Payment: <strong className={styles.paymentTextStrong}>{order?.status?.toLowerCase() === "draft" || mode === "create" ? "NIL" : paymentMode}</strong>
              </span>
            </div>
          </div>
          
          <div className={`${styles.headerMeta} ${styles.headerMetaAlignRight}`}>
            <span className={styles.orderTimeLabel}>Order time</span>
            <strong className={styles.orderTimeValue}>
              {mode === "create" 
                ? new Date().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : (order?.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-")}
            </strong>
          </div>
        </div>

        <div className={styles.content}>
          {mode === "view" ? (
            <>
              {/* View Mode */}
              <div className={styles.viewModeGrid}>
                <div className={styles.viewCard}>
                  <div className={styles.viewRow}>
                    <span>Invoice</span>
                    <span>INV-{soNumber.split("-")[1] || "001"}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Customer</span>
                    <span>{customerType}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Name</span>
                    <span>{customerName}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Phone</span>
                    <span>{phone || "N/A"}</span>
                  </div>
                </div>
                <div className={styles.viewCard}>
                  <div className={styles.viewRow}>
                    <span>Items</span>
                    <span>{orderItems.length} items</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Paid</span>
                    <span className={styles.paidDateValue}>
                      {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className={styles.sectionTitle}>Purchased Product</h3>
              
              <div className={`${styles.tableHeader} ${styles.tableHeaderFourCols}`}>
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>
              
              {orderItems.map((item, idx) => (
                <div key={item.id || idx} className={`${styles.productItem} ${styles.productItemFourCols}`}>
                  <div className={styles.productInfo}>
                    <h4>{item.productName}</h4>
                  </div>
                  <div className={styles.priceCol}>₹{Number(item.sellingPrice || item.purchaseRate || 0).toFixed(2)}</div>
                  <div className={styles.priceCol}>{item.qty}</div>
                  <div className={styles.totalCol}>₹{(Number(item.sellingPrice || item.purchaseRate || 0) * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Edit / Create Mode */}
              <h3 className={styles.sectionTitle}>Order Detail</h3>
              
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>SO no. <span className={styles.required}>*</span></label>
                  <input type="text" className={styles.input} value={soNumber} onChange={e => setSoNumber(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Customer Type <span className={styles.required}>*</span></label>
                  <CustomSelect 
                    options={customerTypeOptions} 
                    value={customerType} 
                    onChange={(val: string) => setCustomerType(val)}
                    width="100%"
                    height="42px"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input type="text" className={styles.input} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone <span className={styles.required}>*</span></label>
                  <div className={styles.phoneGroup}>
                    <div className={styles.phonePrefix}>+91</div>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
                  </div>
                </div>
              </div>

              <div className={styles.searchProductGroup}>
                <label className={`${styles.label} ${styles.browseProductLabel}`}>Browse Product</label>
                <div className={styles.searchBox}>
                  <input 
                    type="text" 
                    placeholder="Type to add product" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <FiSearch color="#94a3b8" />
                </div>
                
                {searchQuery && (
                  <div className={styles.productDropdownList}>
                    {products.filter(p => p.productName?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                      <div 
                        key={p.id}
                        className={styles.productDropdownItem}
                        onClick={() => handleProductSelect(p)}
                      >
                        <div>
                          <div className={styles.productDropdownName}>{p.productName}</div>
                          <div className={styles.productDropdownPrice}>₹{Number(p.sellingPrice || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.tableHeader}>
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span></span>
              </div>

              {orderItems.map((item, idx) => {
                const price = Number(item.sellingPrice || item.purchaseRate || 0);
                const isLowStock = Number(item.quantity || 0) < 20;
                
                return (
                  <div key={item.id || idx} className={styles.productItem}>
                    <div className={styles.productInfo}>
                      <h4>{item.productName}</h4>
                      <div className={`${styles.stockStatus} ${isLowStock ? styles.stockLow : styles.stockIn}`}>
                        {isLowStock ? "Low stock: " : "In stock: "}{item.quantity || 16}
                      </div>
                    </div>
                    <div className={styles.priceCol}>₹{price.toFixed(0)}</div>
                    <div className={styles.qtyControl}>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <div className={styles.qtyControlButtonsContainer}>
                        <button className={`${styles.qtyControlBtn} ${styles.qtyControlBtnTop}`} onClick={() => updateItemQty(item.id, item.qty + 1)}>▲</button>
                        <button className={`${styles.qtyControlBtn} ${styles.qtyControlBtnBottom}`} onClick={() => updateItemQty(item.id, item.qty - 1)}>▼</button>
                      </div>
                    </div>
                    <div className={styles.totalCol}>₹{(price * item.qty).toFixed(2)}</div>
                    <button className={styles.deleteBtn} onClick={() => removeItem(item.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}

            </>
          )}

          <div className={styles.billSummary}>
            <h4 className={`${styles.sectionTitle} ${styles.sectionTitleSmall}`}>Bill Summary</h4>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Discount:</span>
              <span>{discount}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total:</span>
              <span className={styles.value}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {mode !== "view" && (
            <div className={styles.paymentSection}>
              <h4 className={`${styles.sectionTitle} ${styles.sectionTitleSmall}`}>Payment</h4>
              <div className={styles.paymentOptions}>
                {["Cash", "UPI", "Card"].map((opt) => (
                  <div 
                    key={opt} 
                    className={`${styles.paymentOption} ${paymentMode === opt ? styles.active : ""}`}
                    onClick={() => setPaymentMode(opt)}
                  >
                    <div className={styles.radioCircle}></div>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {mode !== "view" ? (
            <>
              <button className={styles.btnDraft} onClick={saveToLocalDraft}>
                <FiFileText /> Save draft
              </button>
              <div className={styles.footerRight}>
                <button className={styles.btnCancel} onClick={onClose}>
                  Cancel
                </button>
                <button className={styles.btnNext} onClick={handleSubmit}>
                  Complete order
                </button>
              </div>
            </>
          ) : (
            <div className={`${styles.footerRight} ${styles.footerRightExport}`}>
              <button className={styles.btnNext} onClick={() => setIsExportOpen(true)}>
                <FiUploadCloud className={styles.exportIcon} /> Export
              </button>
            </div>
          )}
        </div>
        
      </div>

      <ExportDialog 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        title="Sales Order Details"
        filename={`Sales_Order_${soNumber}`}
        columns={["Product", "Price", "Quantity", "Total"]}
        data={orderItems.map(item => [
          item.productName,
          `Rs. ${Number(item.sellingPrice || item.purchaseRate || 0).toFixed(2)}`,
          String(item.qty),
          `Rs. ${(Number(item.sellingPrice || item.purchaseRate || 0) * item.qty).toFixed(2)}`
        ])}
      />
    </div>
  );
}
