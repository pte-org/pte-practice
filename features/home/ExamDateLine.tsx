"use client";

import { useEffect, useState } from "react";
import { AppIcon, Modal, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { fetchProfile, saveProfile } from "./exam-date-api";
import {
  buildCalendarDays,
  examDateBounds,
  formatExamDate,
  formatMonthYearHeader,
  formatShortExamDate,
  getWeekdayLabels,
} from "./exam-date";

/**
 * Target exam date indicator with Google Calendar / Material Date Picker styled modal dialog.
 * Loads the student's planned exam date and allows selecting days visually or typing directly.
 */
export function ExamDateLine() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [examDate, setExamDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  // Calendar navigation state
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());
  const [manualInput, setManualInput] = useState<boolean>(false);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetchProfile()
      .then((profile) => {
        if (active) {
          setExamDate(profile.examDate);
          setSelectedDate(profile.examDate ?? "");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const bounds = examDateBounds();
  const [minYear, minMonth] = bounds.min.split("-").map(Number);
  const [maxYear, maxMonth] = bounds.max.split("-").map(Number);

  const handleOpen = () => {
    const initial = examDate || bounds.todayStr;
    setSelectedDate(examDate ?? "");
    const [y, m] = initial.split("-").map(Number);
    setViewYear(y || new Date().getFullYear());
    setViewMonth(m ? m - 1 : new Date().getMonth());
    setManualInput(false);
    setShowMonthPicker(false);
    setOpen(true);
  };

  const handleClose = () => {
    if (busy) return;
    setOpen(false);
  };

  const handleSave = async () => {
    if (!selectedDate || busy) return;
    setBusy(true);
    try {
      await saveProfile(selectedDate);
      setExamDate(selectedDate);
      setOpen(false);
      showToast(t("examDate.saveSuccess"), { tone: "success" });
    } catch {
      showToast(t("examDate.saveError"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await saveProfile(null);
      setExamDate(null);
      setSelectedDate("");
      setOpen(false);
      showToast(t("examDate.clearSuccess"), { tone: "success" });
    } catch {
      showToast(t("examDate.saveError"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const isPrevDisabled =
    viewYear < minYear || (viewYear === minYear && viewMonth <= minMonth - 1);
  const isNextDisabled =
    viewYear > maxYear || (viewYear === maxYear && viewMonth >= maxMonth - 1);

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const formattedDate = formatExamDate(examDate, locale);
  const shortHeadline =
    formatShortExamDate(selectedDate, locale) ?? t("examDate.chooseDate");
  const weekdays = getWeekdayLabels(locale);
  const calendarData = buildCalendarDays(
    viewYear,
    viewMonth,
    selectedDate,
    bounds.min,
    bounds.max,
    bounds.todayStr,
  );

  return (
    <>
      <p className="exam-date-line">
        <AppIcon name="calendar" size={16} />
        <span>{t("examDate.label")}</span>{" "}
        <strong>
          {loading
            ? t("examDate.loading")
            : formattedDate ?? t("examDate.notScheduled")}
        </strong>
        <button
          className="exam-date-edit-btn"
          type="button"
          aria-label={t("examDate.editAria")}
          onClick={handleOpen}
        >
          <AppIcon name="edit" size={14} />
        </button>
      </p>

      <Modal
        open={open}
        onClose={handleClose}
        size="sm"
        className="exam-calendar-dialog"
        isDismissDisabled={busy}
        closeOnBackdropClick={!busy}
      >
        <div className="exam-calendar-modal-content">
          {/* Top bar: Close (✕) and Save (Lưu) */}
          <div className="exam-calendar-topbar">
            <button
              type="button"
              className="exam-calendar-close-btn"
              onClick={handleClose}
              disabled={busy}
              aria-label={t("examDate.close")}
            >
              ✕
            </button>
            <button
              type="button"
              className="exam-calendar-save-btn"
              disabled={busy || !selectedDate || selectedDate === examDate}
              onClick={handleSave}
            >
              {t("examDate.save")}
            </button>
          </div>

          {/* Selected Date Headline with Edit Pencil */}
          <div className="exam-calendar-display">
            <div className="exam-calendar-label">{t("examDate.chooseDate")}</div>
            <div className="exam-calendar-display-row">
              <span className="exam-calendar-big-date">{shortHeadline}</span>
              <button
                type="button"
                className={`exam-calendar-pencil-btn${manualInput ? " is-active" : ""}`}
                onClick={() => setManualInput((v) => !v)}
                aria-label={t("examDate.toggleManualInput")}
                title={t("examDate.toggleManualInput")}
              >
                <AppIcon name="edit" size={18} />
              </button>
            </div>

            {manualInput ? (
              <div className="exam-calendar-manual-entry">
                <input
                  id="exam-date-manual-input"
                  type="date"
                  min={bounds.min}
                  max={bounds.max}
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDate(val);
                    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      const [y, m] = val.split("-").map(Number);
                      if (y && m) {
                        setViewYear(y);
                        setViewMonth(m - 1);
                      }
                    }
                  }}
                  className="exam-date-input"
                  autoFocus
                />
              </div>
            ) : null}
          </div>

          {/* Month & Year Navigation Row */}
          <div className="exam-calendar-nav">
            <button
              type="button"
              className="exam-calendar-nav-title"
              onClick={() => setShowMonthPicker((v) => !v)}
              aria-expanded={showMonthPicker}
            >
              <span>{formatMonthYearHeader(viewYear, viewMonth, locale)}</span>
              <AppIcon name="chevronDown" size={16} />
            </button>
            <div className="exam-calendar-nav-arrows">
              <button
                type="button"
                className="exam-calendar-nav-btn"
                disabled={isPrevDisabled}
                onClick={handlePrevMonth}
                aria-label={t("examDate.prevMonth")}
              >
                <AppIcon name="chevronLeft" size={18} />
              </button>
              <button
                type="button"
                className="exam-calendar-nav-btn"
                disabled={isNextDisabled}
                onClick={handleNextMonth}
                aria-label={t("examDate.nextMonth")}
              >
                <AppIcon name="chevronRight" size={18} />
              </button>
            </div>
          </div>

          {/* Month / Year Quick Picker (when toggled) */}
          {showMonthPicker ? (
            <div className="exam-calendar-month-selector">
              <div className="exam-calendar-year-row">
                <button
                  type="button"
                  className="exam-calendar-nav-btn"
                  disabled={viewYear <= minYear}
                  onClick={() => setViewYear((y) => y - 1)}
                  aria-label="Previous Year"
                >
                  <AppIcon name="chevronLeft" size={16} />
                </button>
                <span className="exam-calendar-year-title">{viewYear}</span>
                <button
                  type="button"
                  className="exam-calendar-nav-btn"
                  disabled={viewYear >= maxYear}
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="Next Year"
                >
                  <AppIcon name="chevronRight" size={16} />
                </button>
              </div>
              <div className="exam-calendar-months-grid">
                {Array.from({ length: 12 }, (_, i) => {
                  const mStr = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
                  const isBefore = mStr < bounds.min.slice(0, 7);
                  const isAfter = mStr > bounds.max.slice(0, 7);
                  const isCurrentMonth = i === viewMonth;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isBefore || isAfter}
                      className={`exam-calendar-month-item${isCurrentMonth ? " is-active" : ""}`}
                      onClick={() => {
                        setViewMonth(i);
                        setShowMonthPicker(false);
                      }}
                    >
                      {locale.startsWith("vi")
                        ? `Tháng ${i + 1}`
                        : new Intl.DateTimeFormat(locale, { month: "short" }).format(
                            new Date(viewYear, i, 1),
                          )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Day of Week Headers */}
              <div className="exam-calendar-weekdays" aria-hidden="true">
                {weekdays.map((dayLabel, idx) => (
                  <span key={idx} className="exam-calendar-weekday">
                    {dayLabel}
                  </span>
                ))}
              </div>

              {/* 7-column Calendar Days Grid */}
              <div className="exam-calendar-grid" role="grid">
                {Array.from({ length: calendarData.leadingBlankCount }).map((_, i) => (
                  <span key={`blank-${i}`} className="exam-calendar-empty-slot" aria-hidden="true" />
                ))}
                {calendarData.days.map((cell) => (
                  <button
                    key={cell.dateStr}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => handleSelectDay(cell.dateStr)}
                    className={`exam-calendar-day${cell.isSelected ? " is-selected" : ""}${
                      cell.isToday && !cell.isSelected ? " is-today" : ""
                    }`}
                    aria-label={cell.dateStr}
                    aria-pressed={cell.isSelected}
                  >
                    {cell.day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Clear Exam Date action (if date already set) */}
          {examDate ? (
            <div className="exam-calendar-footer">
              <button
                type="button"
                className="exam-calendar-clear-btn"
                disabled={busy}
                onClick={handleClear}
              >
                {t("examDate.clear")}
              </button>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
