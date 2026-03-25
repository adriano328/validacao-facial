import { LoginForm } from '../../components/login-form/login-form';
import styles from './login-page.module.css';
import logoComademat from "@/shared/assets/comademat-icone.png";

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.containerIcone}>
        <img src={logoComademat} alt="Icone Comademat" style={{
          width: "180px",
          marginBottom: "16px",
        }} />
        </div>
        <LoginForm />
      </section>
    </main>
  );
}