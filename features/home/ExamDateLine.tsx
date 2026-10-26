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
  const [showYearPicker, setShowYearPicker] = useState<boolean>(false);
  const [manualDateText, setManualDateText] = useState<string>("");

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

  const baseYear = Math.min(new Date().getFullYear(), minYear);
  const endYear = Math.max(baseYear + 14, 2040);
  const years = Array.from({ length: endYear - baseYear + 1 }, (_, i) => baseYear + i);

  const handleOpen = () => {
    const initial = examDate || bounds.todayStr;
    setSelectedDate(examDate ?? "");
    const [y, m] = (initial ?? "").split("-").map(Number);
    setViewYear(y || new Date().getFullYear());
    setViewMonth(m ? m - 1 : new Date().getMonth());
    if (examDate && /^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      const [ey, em, ed] = examDate.split("-");
      setManualDateText(`${ed}/${em}/${ey}`);
    } else {
      setManualDateText("");
    }
    setManualInput(false);
    setShowYearPicker(false);
    setOpen(true);
  };

  const toggleManualInput = () => {
    if (!manualInput) {
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const [y, m, d] = selectedDate.split("-");
        setManualDateText(`${d}/${m}/${y}`);
      }
      setManualInput(true);
      setShowYearPicker(false);
    } else {
      setManualInput(false);
    }
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualDateText(val);

    const match = val.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
      const d = Number(match[1]);
      const m = Number(match[2]);
      const y = Number(match[3]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
        const daysInMonth = new Date(y, m, 0).getDate();
        if (d <= daysInMonth) {
          const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          setSelectedDate(iso);
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
    }
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
    const [y, m, d] = dateStr.split("-");
    setManualDateText(`${d}/${m}/${y}`);
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setShowYearPicker(false);
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [, m, d] = selectedDate.split("-");
      const daysInMonth = new Date(year, Number(m), 0).getDate();
      if (Number(d) <= daysInMonth) {
        const iso = `${year}-${m}-${d}`;
        setSelectedDate(iso);
        setManualDateText(`${d}/${m}/${year}`);
      }
    }
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

          {/* Selected Date Headline with Edit Pencil / Calendar toggle */}
          <div className="exam-calendar-display">
            <div className="exam-calendar-label">{t("examDate.chooseDate")}</div>
            <div className="exam-calendar-display-row">
              <span className="exam-calendar-big-date">{shortHeadline}</span>
              <button
                type="button"
                className="exam-calendar-toggle-btn"
                onClick={toggleManualInput}
                aria-label={t("examDate.toggleManualInput")}
                title={t("examDate.toggleManualInput")}
              >
                <AppIcon name={manualInput ? "calendar" : "edit"} size={20} />
              </button>
            </div>
          </div>

          {manualInput ? (
            /* Mode 1: Manual Input (Screenshot 1) */
            <div className="exam-calendar-manual-container">
              <div className="exam-calendar-outlined-field">
                <label htmlFor="exam-date-text-input" className="exam-calendar-floating-label">
                  {t("examDate.inputLabel")}
                </label>
                <input
                  id="exam-date-text-input"
                  type="text"
                  inputMode="numeric"
                  className="exam-calendar-outlined-input"
                  placeholder="DD/MM/YYYY"
                  value={manualDateText}
                  onChange={handleManualDateChange}
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <>
              {/* Month & Year Navigation Row (Screenshot 2 & 3) */}
              <div className="exam-calendar-nav">
                <button
                  type="button"
                  className="exam-calendar-nav-title"
                  onClick={() => setShowYearPicker((v) => !v)}
                  aria-expanded={showYearPicker}
                >
                  <span>{formatMonthYearHeader(viewYear, viewMonth, locale)}</span>
                  <span className="exam-calendar-triangle">{showYearPicker ? "▲" : "▼"}</span>
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

              {showYearPicker ? (
                /* Mode 2: Year Selector Grid (Screenshot 2) */
                <div className="exam-calendar-years-container">
                  <div className="exam-calendar-years-grid">
                    {years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={`exam-calendar-year-pill${y === viewYear ? " is-active" : ""}`}
                        onClick={() => handleSelectYear(y)}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Mode 3: Calendar Days View (Screenshot 3) */
                <>
                  <div className="exam-calendar-weekdays" aria-hidden="true">
                    {weekdays.map((dayLabel, idx) => (
                      <span key={idx} className="exam-calendar-weekday">
                        {dayLabel}
                      </span>
                    ))}
                  </div>

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
            </>
          )}

          {/* Clear Exam Date action (if date already set) */}
          {examDate && !manualInput && !showYearPicker ? (
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
