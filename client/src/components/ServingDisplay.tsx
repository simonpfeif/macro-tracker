import { useState } from "react";
import { Pencil, Check, X, RotateCcw } from "lucide-react";
import { canToggleUnit, getAlternateServing } from "../utils/unitConversion";
import { useServingSizeOverrides } from "../contexts/ServingSizeContext";
import styles from "./ServingDisplay.module.css";

interface ServingDisplayProps {
  servingSize: string;
  foodId?: string;
  foodName?: string;
  className?: string;
  editable?: boolean;
}

export function ServingDisplay({
  servingSize,
  foodId,
  foodName,
  className,
  editable = false,
}: ServingDisplayProps) {
  const [showAlternate, setShowAlternate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const { getCustomServing, saveOverride, deleteOverride, hasOverride } =
    useServingSizeOverrides();

  const displayServing = foodId ? getCustomServing(foodId, servingSize) : servingSize;
  const canToggle = canToggleUnit(displayServing);
  const alternateServing = canToggle ? getAlternateServing(displayServing) : null;
  const isOverridden = foodId ? hasOverride(foodId) : false;

  const displayValue =
    showAlternate && alternateServing ? alternateServing : displayServing;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(displayServing);
    setIsEditing(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!foodId || !foodName || !editValue.trim()) return;

    setSaving(true);
    try {
      await saveOverride(foodId, foodName, editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save serving size override:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditValue("");
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!foodId) return;

    setSaving(true);
    try {
      await deleteOverride(foodId);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to reset serving size:", error);
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <span
        className={`${styles.editContainer} ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className={styles.editInput}
          placeholder="e.g., 4 oz"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave(e as unknown as React.MouseEvent);
            } else if (e.key === "Escape") {
              handleCancel(e as unknown as React.MouseEvent);
            }
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          className={styles.saveButton}
          disabled={saving || !editValue.trim()}
          title="Save"
        >
          <Check className={styles.iconSmall} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelButton}
          disabled={saving}
          title="Cancel"
        >
          <X className={styles.iconSmall} />
        </button>
        {isOverridden && (
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
            disabled={saving}
            title="Reset to default"
          >
            <RotateCcw className={styles.iconSmall} />
          </button>
        )}
      </span>
    );
  }

  if (!canToggle && !editable) {
    return <span className={className}>{displayValue}</span>;
  }

  return (
    <span className={`${styles.container} ${className || ""}`}>
      <span className={`${styles.serving} ${isOverridden ? styles.overridden : ""}`}>
        {displayValue}
      </span>
      {canToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAlternate(!showAlternate);
          }}
          className={styles.toggleButton}
          title="Toggle g/oz"
        >
          g/oz
        </button>
      )}
      {editable && foodId && foodName && (
        <button
          type="button"
          onClick={handleStartEdit}
          className={styles.editButton}
          title="Customize serving size"
        >
          <Pencil className={styles.iconTiny} />
        </button>
      )}
    </span>
  );
}
