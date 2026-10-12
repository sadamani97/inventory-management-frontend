import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiX, FiSearch, FiTrash2, FiFileText, FiCalendar, FiBox, FiCheck, FiMapPin } from "react-icons/fi";
import { fetchVendorsList, VendorItem, fetchProductsList, ProductItem, createPurchaseOrder, updateProduct } from "@/lib/dashboardApi";
import CustomSelect from "@/components/ui/CustomSelect";
import styles from "@/styles/components/createPOModal.module.css";
import { toast } from "react-toastify";
import { APP_IMAGES } from "@/constants/images";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePOModal({ isOpen, onClose, onSuccess }: CreatePOModalProps) {
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  
  // Step 1 Data
  const [poNumber, setPoNumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("COD (Cash on Delivery)");
  const [note, setNote] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(1);
  const [shipment, setShipment] = useState("indiamart");
  const [status, setStatus] = useState("Pending");

  // Step 2 Data
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<(ProductItem & { qty: number })[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchVendorsList().then(data => setVendors(data || []));
      fetchProductsList().then(data => setProducts(data || []));
      
      const timer = setTimeout(() => {
        setStep(1);
        setOrderItems([]);
        setPoNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const vendorOptions = vendors?.map(v => ({ label: v.vendorName || v.companyName, value: String(v.id || v.vendorId) }));
  
  const paymentOptions = [
    { label: "COD (Cash on Delivery)", value: "COD (Cash on Delivery)" },
    { label: "Net 30", value: "Net 30" },
    { label: "Advance Payment", value: "Advance Payment" },
  ];

  const statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Delivered", value: "Delivered" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const handleProductSelect = (product: ProductItem) => {
    if (!orderItems.find(item => item.id === product.id)) {
      setOrderItems([...orderItems, { ...product, qty: 1 }]);
    }
    setSearchQuery("");
  };

  const updateItemQty = (id: number | undefined, delta: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: number | undefined) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!vendorId || !orderDate) {
        toast.error("Please fill required fields: Vendor, Order Date");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (orderItems.length === 0) {
        toast.error("Please add at least one item.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    // Calculate total
    const subtotal = orderItems.reduce((acc, item) => acc + (Number(item.purchaseRate || item.sellingPrice || 0) * item.qty), 0);
    const taxAmount = subtotal * 0.10;
    const totalAmount = subtotal + taxAmount;

    const items = orderItems.map((item) => ({
      productId: Number(item.id),
      quantity: item.qty,
      unitPrice: Number(item.purchaseRate || item.sellingPrice || 0)
    }));

    const selectedVendor = vendors.find(v => String(v.id || v.vendorId) === vendorId);

    const payload = {
      poNumber,
      vendorId: Number(vendorId),
      vendorName: selectedVendor?.vendorName || selectedVendor?.companyName || "Unknown",
      deliveryAddressId: selectedAddress,
      orderDate: orderDate || new Date().toISOString().split("T")[0],
      expectedDeliveryDate: deliveryDate || orderDate || new Date().toISOString().split("T")[0],
      paymentTerms,
      shipmentMethod: shipment,
      notes: note,
      status: status,
      subtotal,
      taxPercentage: 10,
      taxAmount,
      totalAmount,
      items,
    };

    const res = await createPurchaseOrder(payload);
    if (res?.success) {
      // Automatically update the product quantities in the database right after ordering
      if (status === "Completed" || status === "Delivered" || status === "Received") {
        for (const item of orderItems) {
          if (item.id) {
            await updateProduct(item.id, {
              ...item,
              quantity: (Number(item.quantity) || 0) + item.qty
            });
          }
        }
      }

      toast.success("Purchase Order Created Successfully");
      onSuccess?.();
      onClose();
    }
  };

  // Calculations for step 3
  const subtotal = orderItems.reduce((acc, item) => acc + (Number(item.purchaseRate || item.sellingPrice || 0) * item.qty), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;
  const totalUnits = orderItems.reduce((acc, item) => acc + item.qty, 0);

  const selectedVendor = vendors.find(v => String(v.id || v.vendorId) === vendorId);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.headerIcon}>
              <FiFileText />
            </div>
            <div className={styles.headerText}>
              <h2>Create Purchase order</h2>
              <p>Effortlessly import products and update your inventory.</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
            <div className={styles.stepNum}>{step > 1 ? <FiCheck /> : 1}</div>
            Order Details
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
            <div className={styles.stepNum}>{step > 2 ? <FiCheck /> : 2}</div>
            Add items
          </div>
          <div className={styles.stepLine} />
          <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
            <div className={styles.stepNum}>3</div>
            Review & Submit
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {step === 1 && (
            <>
              <h3 className={styles.sectionTitle}>Order Information</h3>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PO Number</label>
                  <input type="text" className={styles.input} value={poNumber} onChange={e => setPoNumber(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vendor <span className={styles.required}>*</span></label>
                  <CustomSelect 
                    options={vendorOptions} 
                    value={vendorId} 
                    onChange={setVendorId}
                    placeholder="Select Vendor"
                    width="100%"
                    height="42px"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Order Date <span className={styles.required}>*</span></label>
                  <input type="date" className={styles.input} value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Expected Delivery Date</label>
                  <input type="date" className={styles.input} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
                <div className={`${styles.formGroup} ${styles.vendorNotesGroup}`}>
                  <label className={styles.label}>Payment Terms <span className={styles.required}>*</span></label>
                  <CustomSelect 
                    options={paymentOptions} 
                    value={paymentTerms} 
                    onChange={setPaymentTerms}
                    width="100%"
                    height="42px"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Status <span className={styles.required}>*</span></label>
                  <CustomSelect 
                    options={statusOptions} 
                    value={status} 
                    onChange={setStatus}
                    width="100%"
                    height="42px"
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.paymentTermsGroup}`} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>Note</label>
                  <textarea 
                    className={styles.textarea} 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    placeholder="please review all the items, quantities, and specifications listed in this purchase order..."
                  />
                </div>
              </div>

              <div className={styles.addressHeader}>
                <label className={styles.label}>Address <span className={styles.required}>*</span></label>
                <span className={styles.addLink}>+Address</span>
              </div>
              <div className={styles.addressCards}>
                <div className={`${styles.addressCard} ${selectedAddress === 1 ? styles.active : ""}`} onClick={() => setSelectedAddress(1)}>
                  <div className={styles.addressTitle}>
                    <FiMapPin color={selectedAddress === 1 ? "#2563eb" : "#64748b"} /> Silkmill Shop
                  </div>
                  <div className={styles.addressText}>
                    123 Maple Street, APT, Springfield,<br/>IL 62704
                  </div>
                </div>
                <div className={`${styles.addressCard} ${selectedAddress === 2 ? styles.active : ""}`} onClick={() => setSelectedAddress(2)}>
                  <div className={styles.addressTitle}>
                    <FiMapPin color={selectedAddress === 2 ? "#2563eb" : "#64748b"} /> Silkmill Shop
                  </div>
                  <div className={styles.addressText}>
                    123 Maple Street, APT, Springfield,<br/>IL 62704
                  </div>
                </div>
              </div>

              <h3 className={`${styles.sectionTitle} ${styles.shipmentTitle}`}>Shipment <span className={styles.required}>*</span></h3>
              <div className={styles.shipmentCards}>
                <div className={`${styles.shipmentCard} ${shipment === "indiamart" ? styles.active : ""}`} onClick={() => setShipment("indiamart")}>
                  <Image {...APP_IMAGES.INDIAMART} alt={APP_IMAGES.INDIAMART.alt} className={styles.indiamartLogo} />
                  <span className={styles.indiamartLabel}>indiamart.com</span>
                </div>
                <div className={`${styles.shipmentCard} ${shipment === "tradeindia" ? styles.active : ""}`} onClick={() => setShipment("tradeindia")}>
                  <Image {...APP_IMAGES.TRADEINDIA} alt={APP_IMAGES.TRADEINDIA.alt} className={styles.tradeindiaLogo} />
                  <span className={styles.tradeindiaLabel}>tradeindia.com</span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className={styles.sectionTitle}>Add items</h3>
              
              {orderItems.map((item) => (
                <div key={item.id} className={styles.productItem}>
                  <div className={styles.productInfo}>
                    <Image src={item.imageUrl || APP_IMAGES.LOGO.src} alt="Item" width={40} height={40} className={styles.productImg} />
                    <div className={styles.productText}>
                      <h4>{item.productName} <span>| {item.sku}</span></h4>
                      <div className={styles.productPrice}>₹{Number(item.purchaseRate || item.sellingPrice || 0).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className={styles.rightItemActions}>
                    <button className={styles.deleteBtn} onClick={() => removeItem(item.id)}>
                      <FiTrash2 />
                    </button>
                    <div className={styles.qtyControl}>
                      <button className={styles.qtyBtn} onClick={() => updateItemQty(item.id, -1)}>-</button>
                      <span className={styles.itemQtyBadge}>{item.qty}</span>
                      <button className={styles.qtyBtn} onClick={() => updateItemQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}

              <div className={`${styles.formGroup} ${styles.searchProductGroup}`}>
                <label className={styles.label}>Product</label>
                <div className={styles.searchBox}>
                  <FiSearch color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search by Product name" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {searchQuery && (
                  <div className={styles.productDropdownList}>
                    {products.filter(p => p.productName?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                      <div 
                        key={p.id}
                        className={styles.productDropdownItem}
                        onClick={() => handleProductSelect(p)}
                      >
                        <Image src={p.imageUrl || APP_IMAGES.LOGO.src} alt="Item" width={32} height={32}  className={styles.productDropdownImage} />
                        <div>
                          <div className={styles.productDropdownName}>{p.productName} <span>| {p.sku}</span></div>
                          <div className={styles.productDropdownPrice}>₹{Number(p.purchaseRate || p.sellingPrice || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className={`${styles.addLink} ${styles.addMoreLink}`}>+Add More</span>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className={styles.sectionTitle}>Review & Submit</h3>
              
              <div className={styles.reviewBox}>
                <h4 className={styles.orderDetailsTitle}>Order Details</h4>
                <div className={styles.reviewGrid}>
                  <div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Vendor</span>
                      <span className={styles.reviewValue}>{selectedVendor?.vendorName || selectedVendor?.companyName || "N/A"}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Delivery Location</span>
                      <span className={styles.reviewValue}>Silkmill shop</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Payment terms</span>
                      <span className={styles.reviewValue}>{paymentTerms}</span>
                    </div>
                  </div>
                  <div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Order Date</span>
                      <span className={styles.reviewValue}>{orderDate || "N/A"}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Expected Delivery</span>
                      <span className={styles.reviewValue}>{deliveryDate || "N/A"}</span>
                    </div>
                    <div className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Note</span>
                      <span className={styles.reviewValue}>{note ? "Included" : "None"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className={styles.itemOrderedTitle}>Item Ordered</h4>
              {orderItems.map((item) => (
                <div key={item.id} className={`${styles.productItem} ${styles.orderedItemRow}`}>
                  <div className={styles.productInfo}>
                    <Image src={item.imageUrl || APP_IMAGES.LOGO.src} alt="Item" width={40} height={40} className={styles.productImg} />
                    <div className={styles.productText}>
                      <h4>{item.productName} <span>| {item.sku}</span></h4>
                      <span>{item.qty} Item{item.qty > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className={styles.productPrice}>₹{(Number(item.purchaseRate || item.sellingPrice || 0) * item.qty).toFixed(2)}</div>
                </div>
              ))}

              <h4 className={styles.summaryTitle}>Summary</h4>
              <div className={styles.summaryBox}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Subtotal</span>
                  <span className={styles.reviewValue}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Tax</span>
                  <span className={styles.reviewValue}>10%</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className={styles.summaryFooter}>
                  <div className={styles.summaryFooterItem}>
                    <FiFileText /> {orderItems.length} Items
                  </div>
                  <div className={styles.summaryFooterItem}>
                    <FiBox /> {totalUnits} Units
                  </div>
                  <div className={styles.summaryFooterItem}>
                    <FiCalendar /> Due by {deliveryDate || "N/A"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.btnDraft} onClick={onClose}>
            <FiFileText /> Save as draft
          </button>
          <div className={styles.footerRight}>
            <button className={styles.btnCancel} onClick={() => {
              if (step > 1) setStep(step - 1);
              else onClose();
            }}>
              {step > 1 ? "Previous" : "Cancel"}
            </button>
            <button className={styles.btnNext} onClick={step === 3 ? handleSubmit : handleNext}>
              {step === 3 ? "Submit" : "Next"}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
