import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import styles from "./SaveTemplateDialog.module.css";

type SaveTemplateDialogProps = {
  isOpen: boolean;
  mealName: string;
  onClose: () => void;
  onReplace: () => void;
  onSaveWithNewName: (newName: string) => void;
  existingTemplateNames: Set<string>;
};

export default function SaveTemplateDialog({
  isOpen,
  mealName,
  onClose,
  onReplace,
  onSaveWithNewName,
  existingTemplateNames,
}: SaveTemplateDialogProps) {
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNewNameChange = (value: string) => {
    setNewName(value);
    const normalizedName = value.trim().toLowerCase();
    if (normalizedName && existingTemplateNames.has(normalizedName)) {
      setNameError("A meal template with this name already exists");
    } else {
      setNameError(null);
    }
  };

  const handleSaveWithNewName = () => {
    if (!newName.trim() || nameError) return;
    onSaveWithNewName(newName.trim());
    handleClose();
  };

  const handleClose = () => {
    setShowRename(false);
    setNewName("");
    setNameError(null);
    onClose();
  };

  const handleReplace = () => {
    onReplace();
    handleClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>Meal Already Exists</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X className={styles.icon} />
          </button>
        </div>

        <div className={styles.content}>
          {!showRename ? (
            <>
              <p className={styles.message}>
                A meal template named "<strong>{mealName}</strong>" already exists.
              </p>
              <div className={styles.actions}>
                <Button onClick={handleReplace}>Replace Existing</Button>
                <Button variant="outline" onClick={() => setShowRename(true)}>
                  Save with New Name
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.message}>Enter a new name for this meal template:</p>
              <div className={styles.renameField}>
                <Input
                  type="text"
                  placeholder="New meal name"
                  value={newName}
                  onChange={(e) => handleNewNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newName.trim() && !nameError) {
                      handleSaveWithNewName();
                    }
                    if (e.key === "Escape") {
                      setShowRename(false);
                      setNewName("");
                      setNameError(null);
                    }
                  }}
                  className={nameError ? styles.inputError : ""}
                  autoFocus
                />
                {nameError && <span className={styles.errorMessage}>{nameError}</span>}
              </div>
              <div className={styles.actions}>
                <Button onClick={handleSaveWithNewName} disabled={!newName.trim() || !!nameError}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRename(false);
                    setNewName("");
                    setNameError(null);
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
