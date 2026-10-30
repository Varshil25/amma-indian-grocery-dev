import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useLogin } from "../../hooks/use-auth";
import PageHeader from "../../components/PageHeader";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data as { email: string; password: string });
  };

  return (
    <>
      <PageHeader
        title="Login"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Login" }]}
      />
      <section className="section-padding">
        <div className="container mx-auto px-6 flex justify-center">
          <div className="w-full max-w-md">
            <div className="card p-8">
              <div className="text-center mb-8">
                <h2 className="text-h4 font-semibold text-text-500 mb-2">
                  Welcome Back
                </h2>
                <p className="text-body-md text-text-300">
                  Sign in to your account to continue shopping
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
                  <label htmlFor="password" className="input-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`input pr-10 ${errors.password ? "border-red-400" : ""}`}
                      placeholder="Enter your password"
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

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-text-100 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-body-sm text-text-300">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-body-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loginMutation.isPending ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-body-md text-text-300 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
