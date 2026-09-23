import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import styles from "./CustomSelect.module.css";

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
  className?: string;
  onAddNew?: (newLabel: string) => Promise<string | void> | string | void;
  addNewButtonText?: string;
  addNewPlaceholder?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  width = "140px",
  height = "38px",
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
    } catch (err) {
      console.error("Failed to add new item:", err);
    } finally {
      setAddingLoading(false);
    }
  };

  return (
    <div className={`${styles.selectContainer} ${className}`} ref={containerRef} style={{ width }}>
      <button
        type="button"
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerActive : ""}`}
        style={{ height }}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.label}>{selectedOption ? selectedOption.label : placeholder}</span>
        <FiChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} style={{ width }} role="listbox">
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
                  <FiPlus style={{ marginRight: 4 }} /> {addNewButtonText.replace(/^\+\s*/, "")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
