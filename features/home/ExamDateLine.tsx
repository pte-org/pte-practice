"use client";

import { useEffect, useState } from "react";
import { AppIcon, Modal, useToast } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { fetchProfile, saveProfile } from "./exam-date-api";
import { examDateBounds, formatExamDate } from "./exam-date";

/**
 * Target exam date indicator with edit dialog on the home page.
 * Loads the student's planned exam date and allows setting, changing, or clearing it.
 */
export function ExamDateLine() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [examDate, setExamDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

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

  const handleOpen = () => {
    setSelectedDate(examDate ?? "");
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

  const formattedDate = formatExamDate(examDate, locale);
  const bounds = examDateBounds();

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
        title={t("examDate.dialogTitle")}
        titleIcon={<AppIcon name="calendar" size={20} />}
        closeLabel={t("examDate.close")}
        footer={
          <>
            {examDate ? (
              <button
                className="text-button text-button-danger"
                type="button"
                disabled={busy}
                onClick={handleClear}
              >
                {t("examDate.clear")}
              </button>
            ) : null}
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={handleClose}
            >
              {t("examDate.close")}
            </button>
            <button
              className="button button-primary button-pill"
              type="button"
              disabled={busy || !selectedDate || selectedDate === examDate}
              onClick={handleSave}
            >
              {t("examDate.save")}
            </button>
          </>
        }
      >
        <div className="exam-date-form">
          <label htmlFor="exam-date-input" className="exam-date-label">
            {t("examDate.dateLabel")}
          </label>
          <input
            id="exam-date-input"
            type="date"
            min={bounds.min}
            max={bounds.max}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="exam-date-input"
          />
        </div>
      </Modal>
    </>
  );
}
