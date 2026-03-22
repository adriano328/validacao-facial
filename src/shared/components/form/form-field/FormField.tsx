import React from "react";

import styles from "./form-field.module.css";

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className={styles["ff-container"]}>
      <label className={styles["ff-label"]}>
        {label} {required && <span className={styles["ff-star"]}>*</span>}
      </label>

      {children}

      {error ? <span className={styles["ff-errorText"]}>{error}</span> : null}
    </div>
  );
}