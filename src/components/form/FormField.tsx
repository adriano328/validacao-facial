import React from "react";
import "./formField.css";

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div className="ff-container">
      <label className="ff-label">
        {label} {required && <span className="ff-star">*</span>}
      </label>

      {children}

      {error ? <span className="ff-errorText">{error}</span> : null}
    </div>
  );
}
