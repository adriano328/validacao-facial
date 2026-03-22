import { FormField } from '../../../../shared/components/form/form-field/FormField';
import { useLoginForm } from '../../hooks/use-login-form';
import styles from './login-form.module.css';

export function LoginForm() {
  const {
    form,
    setField,
    touchField,
    showError,
    submit,
    goToRegister,
    isSubmitting,
  } = useLoginForm();

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <FormField label="E-mail" required error={showError('email')}>
        <input
          className={styles.input}
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          onBlur={() => touchField('email')}
          placeholder="seuemail@seuemail.com"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
        />
      </FormField>

      <FormField label="Senha" required error={showError('password')}>
        <input
          className={styles.input}
          type="password"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          onBlur={() => touchField('password')}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </FormField>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.primary}`}
          type="button"
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          className={`${styles.button} ${styles.secondary}`}
          type="button"
          onClick={goToRegister}
          disabled={isSubmitting}
        >
          Cadastrar
        </button>
      </div>
    </form>
  );
}