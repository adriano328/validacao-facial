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
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FormField label="E-mail" required error={showError('email')}>
        <input
          className="inputPadrao"
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
          className="inputPadrao"
          type="password"
          value={form.password}
          onChange={(e) => setField('password', e.target.value)}
          onBlur={() => touchField('password')}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </FormField>

      <div className={`${styles.actions} containerBotoes`}>
        <button
          className="botaoPadrao botaoPrimario"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <button
          className="botaoPadrao botaoSecundario"
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