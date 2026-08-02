import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForgotPassword } from "../../hooks/use-auth";
import PageHeader from "../../components/PageHeader";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const mutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: ForgotForm) => {
    mutation.mutate(data, {
      onSuccess: () => setSubmitted(true),
    });
  };

  return (
    <>
      <PageHeader
        title="Forgot Password"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Login", href: "/login" },
          { label: "Forgot Password" },
        ]}
      />
      <section className="section-padding">
        <div className="container mx-auto px-6 flex justify-center">
          <div className="w-full max-w-md">
            <div className="card p-8">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="text-green-500" size={28} />
                  </div>
                  <h2 className="text-h4 font-semibold text-text-500 mb-2">
                    Check Your Email
                  </h2>
                  <p className="text-body-md text-text-300 mb-6">
                    If an account exists with that email, we've sent a 6-digit
                    reset code. Check your inbox and spam folder.
                  </p>
                  <Link
                    to="/reset-password"
                    className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Enter Reset Code
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-h4 font-semibold text-text-500 mb-2">
                      Forgot Your Password?
                    </h2>
                    <p className="text-body-md text-text-300">
                      Enter your email and we'll send you a code to reset your
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

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {mutation.isPending ? (
                        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Send Reset Code"
                      )}
                    </button>
                  </form>

                  <p className="text-center text-body-md text-text-300 mt-6">
                    Remember your password?{" "}
                    <Link
                      to="/login"
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      Sign In
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
