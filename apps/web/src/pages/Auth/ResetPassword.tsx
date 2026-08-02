import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { useResetPassword } from "../../hooks/use-auth";
import PageHeader from "../../components/PageHeader";

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    code: z.string().length(6, "Code must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof schema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ResetForm) => {
    const { confirmPassword, ...payload } = data;
    mutation.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Reset Password"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Login", href: "/login" },
          { label: "Reset Password" },
        ]}
      />
      <section className="section-padding">
        <div className="container mx-auto px-6 flex justify-center">
          <div className="w-full max-w-md">
            <div className="card p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-green-500" size={28} />
                </div>
                <h2 className="text-h4 font-semibold text-text-500 mb-2">
                  Reset Your Password
                </h2>
                <p className="text-body-md text-text-300">
                  Enter the 6-digit code sent to your email and choose a new
                  password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="input-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`input ${errors.email ? "border-red-400" : ""}`}
                    placeholder="you@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="code" className="input-label">
                    Reset Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className={`input text-center tracking-[0.5em] text-lg font-mono ${errors.code ? "border-red-400" : ""}`}
                    placeholder="000000"
                    {...register("code")}
                  />
                  {errors.code && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="input-label">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      className={`input pr-10 ${errors.newPassword ? "border-red-400" : ""}`}
                      placeholder="Minimum 8 characters"
                      {...register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200 hover:text-text-400 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="input-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`input ${errors.confirmPassword ? "border-red-400" : ""}`}
                    placeholder="Re-enter your password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              <p className="text-center text-body-md text-text-300 mt-6">
                Didn't receive a code?{" "}
                <Link
                  to="/forgot-password"
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Resend Code
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
