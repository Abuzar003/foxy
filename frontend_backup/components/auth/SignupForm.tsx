"use client";

import { useForm } from "react-hook-form";

type Role = "customer" | "provider";

interface BaseSignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CustomerSignupPayload extends BaseSignupPayload {
  role: "customer";
}

export interface ProviderSignupPayload extends BaseSignupPayload {
  role: "provider";
}

export type SignupPayload = CustomerSignupPayload | ProviderSignupPayload;

interface SignupFormProps {
  defaultRole?: Role;
}

export function SignupForm({ defaultRole = "customer" }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupPayload>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: defaultRole,
    },
  });

  const role = watch("role");

  const onSubmit = async (data: SignupPayload) => {
    // TODO: Integrate with FastAPI registration endpoints.
    console.log("Signup payload", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl bg-slate-100 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setValue("role", "customer", { shouldValidate: true })}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === "customer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setValue("role", "provider", { shouldValidate: true })}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              role === "provider"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Provider
          </button>
        </div>
      </div>

      <input type="hidden" {...register("role", { required: true })} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-slate-700">
            First name
          </label>
          <input
            id="firstName"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Ava"
            {...register("firstName", { required: "First name is required" })}
          />
          {errors.firstName ? (
            <p className="mt-1 text-xs text-rose-500">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-slate-700">
            Last name
          </label>
          <input
            id="lastName"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
            placeholder="Shaw"
            {...register("lastName", { required: "Last name is required" })}
          />
          {errors.lastName ? (
            <p className="mt-1 text-xs text-rose-500">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
          placeholder="you@example.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        {errors.email ? <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100"
          placeholder="Create a strong password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting
          ? "Creating account..."
          : role === "provider"
            ? "Create provider account"
            : "Create customer account"}
      </button>
    </form>
  );
}
