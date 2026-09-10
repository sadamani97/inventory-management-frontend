import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
}

export default function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  // Default to June 11, 2026 if no initial value provided (matches demo mockup)
  const [selectedDate, setSelectedDate] = useState<Date>(
    value || new Date(2026, 5, 11)
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"calendar" | "monthYear">("calendar");

  // Temporary state inside popover before clicking "Ok"
  const [tempDate, setTempDate] = useState<Date>(selectedDate);
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state when popover opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setTempDate(selectedDate);
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
      setViewMode("calendar");
    }
  }, [isOpen, selectedDate]);

  // Handle click outside to close popover
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

  // Format header button text e.g. "June 11, 2026"
  const formatPillDate = (date: Date) => {
    const month = MONTH_FULL_NAMES[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Month navigation
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

  // Select day in calendar grid
  const handleDaySelect = (dayNumber: number) => {
    const newTemp = new Date(viewYear, viewMonth, dayNumber);
    setTempDate(newTemp);
  };

  // Action buttons
  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOk = () => {
    if (viewMode === "monthYear") {
      // In monthYear mode, pressing OK applies the month/year selection and returns to calendar view
      const daysInTargetMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const clampedDay = Math.min(tempDate.getDate(), daysInTargetMonth);
      const newTemp = new Date(viewYear, viewMonth, clampedDay);
      setTempDate(newTemp);
      setViewMode("calendar");
    } else {
      // In calendar mode, pressing OK commits the selected date
      setSelectedDate(tempDate);
      if (onChange) {
        onChange(tempDate);
      }
      setIsOpen(false);
    }
  };

  // Calculate calendar grid days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon...

  // Generate Year options for MonthYear picker (e.g., 2020 to 2032)
  const yearsList: number[] = [];
  for (let y = 2020; y <= 2032; y++) {
    yearsList.push(y);
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Trigger Date Pill Button */}
      <button
        type="button"
        className={`${styles.datePill} ${isOpen ? styles.datePillActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Date"
      >
        <span>{formatPillDate(selectedDate)}</span>
        <FiCalendar className={styles.calendarIcon} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className={styles.popover}>
          {/* Popover Header */}
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

          {/* VIEW MODE 1: CALENDAR DAY GRID (Image 1) */}
          {viewMode === "calendar" && (
            <>
              {/* Day Headers Row */}
              <div className={styles.weekDaysRow}>
                {WEEK_DAYS.map((day, idx) => (
                  <div key={idx} className={styles.weekDay}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className={styles.daysGrid}>
                {/* Empty offset cells before day 1 */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className={styles.dayCell} />
                ))}

                {/* Days of current month */}
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

          {/* VIEW MODE 2: MONTH & YEAR DUAL WHEEL PICKER (Image 2) */}
          {viewMode === "monthYear" && (
            <div className={styles.monthYearPickerContainer}>
              {/* Months Column */}
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

              {/* Years Column */}
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

          {/* Footer Actions (Cancel & Ok) */}
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
