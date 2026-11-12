import { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAppDispatch } from "@/store/hooks";
import api from "@/lib/api";
import { setAuthUser, setAuthError } from "@/store/authSlice";
import { setAuthToken } from "@/lib/authToken";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/constants/assets";
import styles from "@/styles/pages/auth.module.css";
import { toast } from "react-toastify";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setStatusMessage(null);
    try {
      const payload = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };
      const response = await api.post("/login", payload);
      const result = response?.data;
      if (result?.success) {
        const tokenStr = result?.token || "authenticated_user_token";
        const userData = {
          firstname: result?.data?.firstname ?? "",
          lastname: result?.data?.lastname ?? "",
          email: result?.data?.email ?? values.email,
        };
        setAuthToken(tokenStr);
        dispatch(
          setAuthUser({
            user: userData,
            token: tokenStr,
            message: result?.message,
          }),
        );
        toast.success(result?.message || "Login successful");
        setStatusMessage(result?.message || "Login successful");
        router.push("/dashboard");
      } else {
        const errText = result?.message || "Login failed";
        dispatch(setAuthError(errText));
        toast.error(errText);
        setStatusMessage(errText);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || "Login failed. Please try again.";
      dispatch(setAuthError(message));
      toast.error(message);
      setStatusMessage(message);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Login to simplify inventory tracking and take control instantly."
      imageSrc={ASSETS.IMAGES.LOGIN_BANNER.src}
      imageAlt={ASSETS.IMAGES.LOGIN_BANNER.alt}
    >
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <Input
          className={styles.inputBox}
          label="Email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          error={errors.email?.message?.toString()}
        />
        <Input
          className={styles.inputBox}
          label="Password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          error={errors.password?.message?.toString()}
        />

        <div className={styles.loginOptionsRow}>
          <label className={styles.checkboxContainer}>
            <input type="checkbox" className={styles.checkboxInput} />
            <span>Remember me</span>
          </label>
          <Link href="#" className={styles.forgotPasswordLink}>
            Forgot password?
          </Link>
        </div>

        {statusMessage ? <div className={styles.statusBox}>{statusMessage}</div> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>

        <div className={styles.socialLoginSeparator}>or create with</div>

        <div className={styles.socialBtnGroup}>
          <button type="button" className={styles.socialBtn}>
            <Image {...ASSETS.LOGOS.GOOGLE} alt={ASSETS.LOGOS.GOOGLE.alt} />
            Google
          </button>
          <button type="button" className={styles.socialBtn}>
            <Image {...ASSETS.LOGOS.APPLE} alt={ASSETS.LOGOS.APPLE.alt} />
            Apple
          </button>
        </div>

        <p className={styles.authRedirectText}>
          Don’t have an account?{" "}
          <Link href="/signup" className={styles.authRedirectLink}>
            Register now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

