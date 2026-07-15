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
import styles from "@/styles/pages/signup.module.css";

const signupSchema = z
  .object({
    firstname: z.string().min(3, "First name must have at least 3 characters").max(50).trim(),
    lastname: z.string().min(1, "Last name must have at least 1 character").max(50).trim(),
    email: z.string().email("Enter a valid email").trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .trim(),
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupForm) => {
    setStatusMessage(null);
    try {
      const response = await api.post("/signup", values);
      const result = response.data;
      if (result.success) {
        dispatch(
          setAuthUser({
            user: {
              firstname: values.firstname,
              lastname: values.lastname,
              email: values.email,
            },
            token: result.token,
            message: result.message,
          }),
        );
        setStatusMessage(result.message || "Signup successful");
        router.push("/login");
      } else {
        dispatch(setAuthError("Signup failed"));
        setStatusMessage(result.message || "Signup failed");
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || "Signup failed. Please try again.";
      dispatch(setAuthError(message));
      setStatusMessage(message);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Build your inventory dashboard and manage stock with confidence."
      imageSrc="/images/signupimage.svg"
      imageAlt="Signup illustration"
    >
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputRow}>
          <Input
            wrapperClassName={styles.inputGroup}
            className={styles.inputBox}
            label="First name"
            placeholder="Enter first name"
            {...register("firstname")}
            error={errors.firstname?.message?.toString()}
          />
          <Input
            wrapperClassName={styles.inputGroup}
            className={styles.inputBox}
            label="Last name"
            placeholder="Enter last name"
            {...register("lastname")}
            error={errors.lastname?.message?.toString()}
          />
        </div>
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
          placeholder="Enter password"
          {...register("password")}
          error={errors.password?.message?.toString()}
        />
              <div className="login-options-row">
          <label className="checkbox-container">
            <input type="checkbox" className="checkbox-input" required />
            <span>
              I agree to the Stockflow <Link href="#" className="checkbox-link">terms</Link> and{" "}
              <Link href="#" className="checkbox-link">conditions</Link>
            </span>
          </label>
        </div>

        {statusMessage ? <div className={styles.statusBox}>{statusMessage}</div> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link href="/login" className="auth-redirect-link">
            Login Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

