import Image from "next/image";
  import Link from "next/link";
  import type { ReactNode } from "react";
  import styles from "./AuthLayout.module.css";

  type AuthLayoutProps = {
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    children: ReactNode;
  };

  export default function AuthLayout({
    title,
    description,
    imageSrc,
    imageAlt,
    children,
  }: AuthLayoutProps) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.pageContainer}>
          <div className={styles.authPanel}>
            <div className={styles.brandPill}>
              <Image src="/images/Logo.svg" alt="Stockflow Logo" width={24} height={24} priority />
              <span className={styles.brandLogoText}>Stockflow</span>
            </div>

            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>{title}</h1>
              <p className={styles.heroDesc}>{description}</p>
            </div>

            <div className={styles.formCard}>{children}</div>

            <div className={styles.authFooter}>
              <span>2026 © Stockflow</span>
              <Link href="#" className={styles.ctaLink}>
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className={styles.imgPanel}>
            <Image src={imageSrc} alt={imageAlt} width={660} height={944} priority />
          </div>
        </div>
      </div>
    );
  }
  
