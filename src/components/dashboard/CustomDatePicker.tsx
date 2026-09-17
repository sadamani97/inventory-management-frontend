import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { HiSelector } from "react-icons/hi";
import styles from "./CustomDatePicker.module.css";

const MONTH_SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_FULL_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface CustomDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  variant?: "default" | "blue";
  icon?: "calendar" | "chevron";
  formatLabel?: (date: Date) => string;
}

export default function CustomDatePicker({
  value,
  onChange,
  variant = "default",
  icon = "calendar",
  formatLabel,
}: CustomDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    value || new Date()
  );

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"calendar" | "monthYear">("calendar");

  const [tempDate, setTempDate] = useState<Date>(selectedDate);
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!isOpen) {
      setTempDate(selectedDate);
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
      setViewMode("calendar");
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatPillDate = (date: Date) => {
    if (formatLabel) {
      return formatLabel(date);
    }
    const month = MONTH_FULL_NAMES[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDaySelect = (dayNumber: number) => {
    const newTemp = new Date(viewYear, viewMonth, dayNumber);
    setTempDate(newTemp);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOk = () => {
    if (viewMode === "monthYear") {
      const daysInTargetMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const clampedDay = Math.min(tempDate.getDate(), daysInTargetMonth);
      const newTemp = new Date(viewYear, viewMonth, clampedDay);
      setTempDate(newTemp);
      setViewMode("calendar");
    } else {
      setSelectedDate(tempDate);
      if (onChange) {
        onChange(tempDate);
      }
      setIsOpen(false);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const yearsList: number[] = [];
  const currentYearNum = new Date().getFullYear();
  const minYear = Math.min(2020, currentYearNum - 5);
  const maxYear = Math.max(2032, currentYearNum + 10);
  for (let y = minYear; y <= maxYear; y++) {
    yearsList.push(y);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.datePill} ${variant === "blue" ? styles.datePillBlue : ""} ${
          isOpen ? styles.datePillActive : ""
        }`}
        onClick={toggleOpen}
        aria-label="Select Date"
      >
        <span>{formatPillDate(selectedDate)}</span>
        {icon === "chevron" ? (
          <FiChevronDown className={styles.calendarIcon} />
        ) : (
          <FiCalendar className={styles.calendarIcon} />
        )}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.monthYearSelector}
              onClick={() => setViewMode(viewMode === "calendar" ? "monthYear" : "calendar")}
              title="Click to change Month and Year"
            >
              <span>{`${MONTH_SHORT_NAMES[viewMonth]} ${viewYear}`}</span>
              <HiSelector className={styles.selectorIcon} />
            </button>

            {viewMode === "calendar" && (
              <div className={styles.navButtons}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <FiChevronLeft />
                </button>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={handleNextMonth}
                  title="Next Month"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>

          {viewMode === "calendar" && (
            <>
              <div className={styles.weekDaysRow}>
                {WEEK_DAYS.map((day, idx) => (
                  <div key={idx} className={styles.weekDay}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.daysGrid}>
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className={styles.dayCell} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isSelected =
                    tempDate.getDate() === dayNum &&
                    tempDate.getMonth() === viewMonth &&
                    tempDate.getFullYear() === viewYear;

                  const today = new Date();
                  const isToday =
                    today.getDate() === dayNum &&
                    today.getMonth() === viewMonth &&
                    today.getFullYear() === viewYear;

                  return (
                    <div key={dayNum} className={styles.dayCell}>
                      <button
                        type="button"
                        className={`${styles.dayBtn} ${
                          isSelected ? styles.dayBtnSelected : ""
                        } ${isToday ? styles.dayBtnToday : ""}`}
                        onClick={() => handleDaySelect(dayNum)}
                      >
                        {dayNum}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "monthYear" && (
            <div className={styles.monthYearPickerContainer}>
              <div className={styles.pickerColumn}>
                {MONTH_SHORT_NAMES.map((mName, mIdx) => {
                  const diff = Math.abs(mIdx - viewMonth);
                  let itemClass = styles.pickerItemDistant;
                  if (diff === 0) itemClass = styles.pickerItemActive;
                  else if (diff === 1) itemClass = styles.pickerItemAdjacent;

                  return (
                    <button
                      key={mName}
                      type="button"
                      className={`${styles.pickerItem} ${itemClass}`}
                      onClick={() => setViewMonth(mIdx)}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>

              <div className={styles.pickerColumn}>
                {yearsList.map((yVal) => {
                  const diff = Math.abs(yVal - viewYear);
                  let itemClass = styles.pickerItemDistant;
                  if (diff === 0) itemClass = styles.pickerItemActive;
                  else if (diff === 1) itemClass = styles.pickerItemAdjacent;

                  return (
                    <button
                      key={yVal}
                      type="button"
                      className={`${styles.pickerItem} ${itemClass}`}
                      onClick={() => setViewYear(yVal)}
                    >
                      {yVal}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.okBtn}
              onClick={handleOk}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
