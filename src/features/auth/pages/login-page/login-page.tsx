import { LoginForm } from '../../components/login-form/login-form';
import styles from './login-page.module.css';

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Entrar</h1>
        <LoginForm />
      </section>
    </main>
  );
}