"use client";

import { useState, type ReactElement } from "react";
import { Button, Modal } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import type { PracticeApiClient } from "../api";
import type { PracticeRubric } from "../rubric-contracts";

interface RubricCriteriaButtonProps {
  api: PracticeApiClient;
  taskType: string;
}

type RubricState = { status: "idle" | "loading" | "error" } | { status: "ready"; rubric: PracticeRubric };

/** Opens the level descriptions of the task type's traits, one trait at a time (same layout as the examiner screen). */
export const RubricCriteriaButton = ({ api, taskType }: RubricCriteriaButtonProps): ReactElement => {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RubricState>({ status: "idle" });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const openCriteria = (): void => {
    setOpen(true);
    if (state.status === "ready" || state.status === "loading") return;
    setState({ status: "loading" });
    void api.getRubric(taskType).then((rubric) => setState({ status: "ready", rubric }))
      .catch(() => setState({ status: "error" }));
  };

  return (
    <>
      <Button type="button" variant="primary" size="sm" onClick={openCriteria}>{t("review.criteria")}</Button>
      <Modal open={open} onClose={() => setOpen(false)} size="xl"
        title={`${t("review.criteriaTitle")} · ${taskType.replaceAll("_", " ")}`}>
        {state.status === "ready" ? <CriteriaBody rubric={state.rubric} vi={locale === "vi"} selectedKey={selectedKey}
          onSelect={setSelectedKey} /> : (
          <p className="rubric-note">{t(state.status === "error" ? "review.criteriaError" : "review.criteriaLoading")}</p>
        )}
      </Modal>
    </>
  );
};

interface CriteriaBodyProps {
  rubric: PracticeRubric;
  vi: boolean;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

const CriteriaBody = ({ rubric, vi, selectedKey, onSelect }: CriteriaBodyProps): ReactElement => {
  const { t } = useTranslation();
  if (rubric.traits.length === 0) return <p className="rubric-note">{t("review.criteriaNone")}</p>;
  const selected = rubric.traits.find((trait) => trait.key === selectedKey) ?? rubric.traits[0];
  const levels = [...selected.levels].sort((left, right) => right.level - left.level);
  return (
    <div className="rubric-body">
      <div className="rubric-traits" role="tablist">
        {rubric.traits.map((trait) => (
          <button key={trait.key} type="button" role="tab" aria-selected={trait.key === selected.key}
            className={`rubric-trait${trait.key === selected.key ? " rubric-trait-active" : ""}`} onClick={() => onSelect(trait.key)}>
            {vi ? trait.displayNameVi : trait.displayNameEn} <span>/{trait.maxScore ?? t("review.criteriaPerWord")}</span>
          </button>
        ))}
      </div>
      <ul className="rubric-levels">
        {levels.map((entry) => (
          <li key={entry.level}><strong>{t("review.criteriaLevel")} {entry.level}</strong><span>{entry.text}</span></li>
        ))}
      </ul>
      <p className="rubric-note">{t("review.criteriaSource")}</p>
    </div>
  );
};
