import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import styles from "./CustomSelect.module.css";
import { toast } from "react-toastify";

export interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string;
  height?: string;
  size?: "sm" | "md";
  className?: string;
  onAddNew?: (newLabel: string) => Promise<string | void> | string | void;
  addNewButtonText?: string;
  addNewPlaceholder?: string;
}

const WIDTH_CLASS_MAP: Record<string, string> = {
  "100%": styles.widthFull,
  "120px": styles.width120,
  "130px": styles.width130,
  "140px": styles.width140,
  "145px": styles.width145,
  "150px": styles.width150,
  "160px": styles.width160,
  "170px": styles.width170,
};

const HEIGHT_CLASS_MAP: Record<string, string> = {
  "32px": styles.height32,
  "34px": styles.height34,
  "36px": styles.height36,
  "40px": styles.height40,
  "42px": styles.height42,
};

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  width,
  height,
  size = "md",
  className = "",
  onAddNew,
  addNewButtonText = "+ Add new category",
  addNewPlaceholder = "Enter new category",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [addingLoading, setAddingLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewItemText("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleAddNewSubmit = async () => {
    if (!newItemText.trim() || !onAddNew) return;
    setAddingLoading(true);
    try {
      const createdValue = await onAddNew(newItemText.trim());
      if (createdValue) {
        onChange(String(createdValue));
      }
      setNewItemText("");
      setIsAdding(false);
      setIsOpen(false);
      toast.error("Failed to add new item");
    } finally {
      setAddingLoading(false);
    }
  };

  const widthClass = width ? WIDTH_CLASS_MAP[width] || "" : "";
  const heightClass = height ? HEIGHT_CLASS_MAP[height] || "" : "";

  const containerClassName = [
    styles.selectContainer,
    size === "sm" ? styles.sizeSm : "",
    widthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} ref={containerRef}>
      <button
        type="button"
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerActive : ""} ${heightClass}`.trim()}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.label}>{selectedOption ? selectedOption.label : placeholder}</span>
        <FiChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
      </button>

      {isOpen && (
        <div className={`${styles.dropdownMenu} ${widthClass}`.trim()} role="listbox">
          <div className={styles.optionsList}>
            {options.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const itemKey = option.value ? String(option.value) : `opt-${index}-${option.label}`;
              return (
                <div
                  key={itemKey}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              );
            })}
          </div>

          {onAddNew && (
            <div className={styles.addNewContainer}>
              {isAdding ? (
                <div className={styles.inputAddBox}>
                  <input
                    type="text"
                    className={styles.addInput}
                    placeholder={addNewPlaceholder}
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewSubmit();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.addBtnAction}
                    onClick={handleAddNewSubmit}
                    disabled={addingLoading || !newItemText.trim()}
                  >
                    {addingLoading ? "Adding..." : addNewButtonText}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.addBtnAction}
                  onClick={() => setIsAdding(true)}
                >
                  <FiPlus className={styles.addBtnIcon} /> {addNewButtonText.replace(/^\+\s*/, "")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
