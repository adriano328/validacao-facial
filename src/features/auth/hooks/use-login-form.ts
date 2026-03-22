import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginErrors, LoginFormValues } from '../model/auth.types';
import { initialLoginFormValues } from '../model/auth.types';
import {
  hasLoginErrors,
  validateLoginField,
  validateLoginForm,
} from '../model/auth.validators';

type TouchedFields = Partial<Record<keyof LoginFormValues, boolean>>;

export function useLoginForm() {
  const [form, setForm] = useState<LoginFormValues>(initialLoginFormValues);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  function setField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (submitted || touched[field]) {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          const error = validateLoginField(next, field);

          if (error) nextErrors[field] = error;
          else delete nextErrors[field];

          return nextErrors;
        });
      }

      return next;
    });
  }

  function touchField(field: keyof LoginFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prevErrors) => {
      const nextErrors = { ...prevErrors };
      const error = validateLoginField(form, field);

      if (error) nextErrors[field] = error;
      else delete nextErrors[field];

      return nextErrors;
    });
  }

  function validate() {
    const nextErrors = validateLoginForm(form);
    setErrors(nextErrors);
    return !hasLoginErrors(nextErrors);
  }

  function showError(field: keyof LoginFormValues) {
    return submitted || touched[field] ? errors[field] : undefined;
  }

  async function submit() {
    setSubmitted(true);
    setTouched({ email: true, password: true });

    const isValid = validate();
    if (!isValid) return;

    try {
      setIsSubmitting(true);

      const email = form.email.trim();
      const senha = form.password.trim();

      navigate('/liveness', {
        state: { email, senha },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToRegister() {
    navigate('/cadastro');
  }

  const canSubmit = useMemo(() => {
    return !!form.email && !!form.password && !isSubmitting;
  }, [form.email, form.password, isSubmitting]);

  return {
    form,
    errors,
    touched,
    submitted,
    isSubmitting,
    canSubmit,
    setField,
    touchField,
    showError,
    submit,
    goToRegister,
  };
}