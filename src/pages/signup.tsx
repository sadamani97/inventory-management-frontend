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
import { ASSETS } from "@/constants/assets";
import styles from "@/styles/pages/auth.module.css";
import { toast } from "react-toastify";

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
      const payload = {
        ...values,
        email: values.email.trim().toLowerCase(),
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
      };
      const response = await api.post("/signup", payload);
      const result = response?.data;
      if (result?.success) {
        dispatch(
          setAuthUser({
            user: {
              firstname: values.firstname,
              lastname: values.lastname,
              email: values.email,
            },
            token: result?.token,
            message: result?.message,
          }),
        );
        toast.success(result?.message || "Signup successful");
        setStatusMessage(result?.message || "Signup successful");
        router.push("/login");
      } else {
        const errText = result?.message || "Signup failed";
        dispatch(setAuthError(errText));
        toast.error(errText);
        setStatusMessage(errText);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError?.response?.data?.message || "Signup failed. Please try again.";
      dispatch(setAuthError(message));
      toast.error(message);
      setStatusMessage(message);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Build your inventory dashboard and manage stock with confidence."
      imageSrc={ASSETS.IMAGES.SIGNUP_BANNER.src}
      imageAlt={ASSETS.IMAGES.SIGNUP_BANNER.alt}
    >
      <form className={styles.authForm} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.inputRow}>
          <Input
            className={styles.inputBox}
            label="First name"
            placeholder="Enter first name"
            {...register("firstname")}
            error={errors.firstname?.message?.toString()}
          />
          <Input
            className={styles.inputBox}
            label="Last name"
            placeholder="Enter last name"
            {...register("lastname")}
            error={errors.lastname?.message?.toString()}
          />
        </div>
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
          placeholder="Enter password"
          {...register("password")}
          error={errors.password?.message?.toString()}
        />
        <div className={styles.loginOptionsRow}>
          <label className={styles.checkboxContainer}>
            <input type="checkbox" className={styles.checkboxInput} required />
            <span>
              I agree to the Stockflow <Link href="#" className={styles.checkboxLink}>terms</Link> and{" "}
              <Link href="#" className={styles.checkboxLink}>conditions</Link>
            </span>
          </label>
        </div>

        {statusMessage ? <div className={styles.statusBox}>{statusMessage}</div> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
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
          Already have an account?{" "}
          <Link href="/login" className={styles.authRedirectLink}>
            Login Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

