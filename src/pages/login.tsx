import { AxiosError } from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAppDispatch } from "@/store/hooks";
import api from "@/lib/api";
import { setAuthUser, setAuthError } from "@/store/authSlice";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/pages/login.module.css";

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
      const response = await api.post("/login", values);
      const result = response.data;
      if (result.success) {
        dispatch(
          setAuthUser({
            user: {
              firstname: result.data.firstname ?? "",
              lastname: result.data.lastname ?? "",
              email: result.data.email,
            },
            token: result.token,
            message: result.message,
          }),
        );
        setStatusMessage(result.message || "Login successful");
        router.push("/dashboard");
      } else {
        dispatch(setAuthError("Login failed"));
        setStatusMessage(result.message || "Login failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || "Login failed. Please try again.";
      dispatch(setAuthError(message));
      setStatusMessage(message);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      description="Login to simplify inventory tracking and take control instantly."
      imageSrc="/images/loginimage.svg"
      imageAlt="Login illustration"
    >
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <Input
          wrapperClassName={styles.inputGroup}
          className={styles.inputBox}
          label="Email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          error={errors.email?.message?.toString()}
        />
        <Input
          wrapperClassName={styles.inputGroup}
          className={styles.inputBox}
          label="Password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          error={errors.password?.message?.toString()}
        />

        <div className="login-options-row">
          <label className="checkbox-container">
            <input type="checkbox" className="checkbox-input" />
            <span>Remember me</span>
          </label>
          <Link href="#" className="forgot-password-link">
            Forgot password?
          </Link>
        </div>

        {statusMessage ? <div className={styles.statusBox}>{statusMessage}</div> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>

        <div className="social-login-separator">or create with</div>

        <div className="social-btn-group">
          <button type="button" className="social-btn">
            <Image src="/googlelog.svg" alt="Google logo" width={20} height={20} />
            Google
          </button>
          <button type="button" className="social-btn">
            <Image src="/applelogo.svg" alt="Apple logo" width={20} height={20} />
            Apple
          </button>
        </div>

        <p className="auth-redirect-text">
          Don’t have an account?{" "}
          <Link href="/signup" className="auth-redirect-link">
            Register now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

