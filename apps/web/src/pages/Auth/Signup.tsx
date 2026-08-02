import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { useRegister } from "../../hooks/use-auth";
import PageHeader from "../../components/PageHeader";

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Create Account"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sign Up" }]}
      />
      <section className="section-padding">
        <div className="container mx-auto px-6 flex justify-center">
          <div className="w-full max-w-lg">
            <div className="card p-8">
              <div className="text-center mb-8">
                <h2 className="text-h4 font-semibold text-text-500 mb-2">
                  Join Amma Indian Grocery
                </h2>
                <p className="text-body-md text-text-300">
                  Create your account and earn 50 welcome bonus points!
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="input-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`input ${errors.firstName ? "border-red-400" : ""}`}
                      placeholder="First name"
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-body-sm mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="input-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`input ${errors.lastName ? "border-red-400" : ""}`}
                      placeholder="Last name"
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-body-sm mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

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
                  <label htmlFor="phone" className="input-label">
                    Phone Number{" "}
                    <span className="text-text-200 font-normal">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="input"
                    placeholder="(555) 123-4567"
                    {...register("phone")}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="input-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`input pr-10 ${errors.password ? "border-red-400" : ""}`}
                      placeholder="Minimum 8 characters"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200 hover:text-text-400 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="input-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className={`input pr-10 ${errors.confirmPassword ? "border-red-400" : ""}`}
                      placeholder="Re-enter your password"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-200 hover:text-text-400 transition"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-body-sm mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="referralCode" className="input-label">
                    Referral Code{" "}
                    <span className="text-text-200 font-normal">(optional)</span>
                  </label>
                  <input
                    id="referralCode"
                    type="text"
                    className="input"
                    placeholder="e.g. AMMA-ABC12345"
                    {...register("referralCode")}
                  />
                  <p className="text-body-sm text-text-200 mt-1">
                    Have a friend's referral code? Get 100 bonus points!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {registerMutation.isPending ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-body-md text-text-300 mt-6">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
