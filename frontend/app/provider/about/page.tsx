"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiRequest, ApiError } from "@/lib/api";

interface ProviderAboutPayload {
  aadhaar_number: string;
  pan_card?: string;
  address: string;
  services: string[];
  price_per_day: number;
  price_per_hour: number;
  profile_photo: string;
  about: string;
  age: number;
}

interface ProviderAboutFormValues {
  aadhaarNumber: string;
  panCard: string;
  address: string;
  pricePerDay: number;
  pricePerHour: number;
  profilePhoto: string;
  about: string;
  age: number;
}

interface ServiceTaxonomyResponse {
  categories: Record<string, string[]>;
}

export default function ProviderAboutPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [taxonomy, setTaxonomy] = useState<Record<string, string[]>>({});
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProviderAboutFormValues>({
    defaultValues: {
      aadhaarNumber: "",
      panCard: "",
      address: "",
      pricePerDay: 0,
      pricePerHour: 0,
      profilePhoto: "",
      about: "",
      age: 18,
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    if (!token || role !== "provider") {
      router.replace("/auth/login");
      return;
    }

    const loadProviderAbout = async () => {
      try {
        const taxonomyResponse = await apiRequest<ServiceTaxonomyResponse>("/providers/taxonomy");
        setTaxonomy(taxonomyResponse.categories);

        const response = await apiRequest<Partial<ProviderAboutPayload>>("/auth/provider/about", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSelectedServices(response.services ?? []);

        reset({
          aadhaarNumber: response.aadhaar_number ?? "",
          panCard: response.pan_card ?? "",
          address: response.address ?? "",
          pricePerDay: response.price_per_day ?? 0,
          pricePerHour: response.price_per_hour ?? 0,
          profilePhoto: response.profile_photo ?? "",
          about: response.about ?? "",
          age: response.age ?? 18,
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load provider profile.";
        setApiError(message);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadProviderAbout();
  }, [reset, router]);

  const onSubmit = async (data: ProviderAboutFormValues) => {
    try {
      setApiError("");
      setApiSuccess("");

      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const payload: ProviderAboutPayload = {
        aadhaar_number: data.aadhaarNumber.trim(),
        pan_card: data.panCard.trim() || undefined,
        address: data.address.trim(),
        services: selectedServices,
        price_per_day: Number(data.pricePerDay),
        price_per_hour: Number(data.pricePerHour),
        profile_photo: data.profilePhoto.trim(),
        about: data.about.trim(),
        age: Number(data.age),
      };

      await apiRequest("/auth/provider/about", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      setApiSuccess("Provider profile updated successfully.");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to update profile right now.";
      setApiError(message);
    }
  };

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <p className="text-sm text-slate-600">Loading provider profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50 px-6 py-12">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_65px_rgba(15,23,42,0.12)] ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Provider About</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your profile so customers can trust and book your services.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="aadhaarNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
                Aadhaar number
              </label>
              <input
                id="aadhaarNumber"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                placeholder="123412341234"
                {...register("aadhaarNumber", {
                  required: "Aadhaar number is required",
                  pattern: {
                    value: /^\d{12}$/,
                    message: "Aadhaar must be exactly 12 digits",
                  },
                })}
              />
              {errors.aadhaarNumber ? (
                <p className="mt-1 text-xs text-rose-500">{errors.aadhaarNumber.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="panCard" className="mb-1.5 block text-sm font-medium text-slate-700">
                PAN card (optional)
              </label>
              <input
                id="panCard"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 uppercase text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                placeholder="ABCDE1234F"
                {...register("panCard", {
                  validate: (value) => {
                    if (!value) return true;
                    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)
                      ? true
                      : "PAN format should be ABCDE1234F";
                  },
                })}
              />
              {errors.panCard ? <p className="mt-1 text-xs text-rose-500">{errors.panCard.message}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
              Complete address
            </label>
            <textarea
              id="address"
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="House number, street, area, city, state, pincode"
              {...register("address", {
                required: "Address is required",
                minLength: { value: 10, message: "Address should be at least 10 characters" },
              })}
            />
            {errors.address ? <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Services</label>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              {Object.entries(taxonomy).map(([category, services]) => (
                <div key={category} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-800">{category}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {services.map((service) => {
                      const checked = selectedServices.includes(service);
                      return (
                        <label key={service} className="flex items-start gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedServices((prev) =>
                                event.target.checked
                                  ? [...prev, service]
                                  : prev.filter((item) => item !== service),
                              );
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-orange-300"
                          />
                          <span>{service}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length === 0 ? (
              <p className="mt-1 text-xs text-rose-500">Select at least one service.</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pricePerDay" className="mb-1.5 block text-sm font-medium text-slate-700">
                Price per day
              </label>
              <input
                id="pricePerDay"
                type="number"
                step="0.01"
                min="1"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                placeholder="1200"
                {...register("pricePerDay", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Price per day must be greater than 0" },
                })}
              />
              {errors.pricePerDay ? (
                <p className="mt-1 text-xs text-rose-500">{errors.pricePerDay.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="pricePerHour" className="mb-1.5 block text-sm font-medium text-slate-700">
                Price per hour
              </label>
              <input
                id="pricePerHour"
                type="number"
                step="0.01"
                min="1"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
                placeholder="250"
                {...register("pricePerHour", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Price per hour must be greater than 0" },
                })}
              />
              {errors.pricePerHour ? (
                <p className="mt-1 text-xs text-rose-500">{errors.pricePerHour.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="profilePhoto" className="mb-1.5 block text-sm font-medium text-slate-700">
              Profile photo URL
            </label>
            <input
              id="profilePhoto"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="https://example.com/photo.jpg"
              {...register("profilePhoto", {
                required: "Profile photo URL is required",
                minLength: { value: 3, message: "Provide a valid photo URL" },
              })}
            />
            {errors.profilePhoto ? (
              <p className="mt-1 text-xs text-rose-500">{errors.profilePhoto.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="about" className="mb-1.5 block text-sm font-medium text-slate-700">
              About
            </label>
            <textarea
              id="about"
              rows={4}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="Tell customers about your experience and quality standards."
              {...register("about", {
                required: "About section is required",
                minLength: { value: 10, message: "About must be at least 10 characters" },
              })}
            />
            {errors.about ? <p className="mt-1 text-xs text-rose-500">{errors.about.message}</p> : null}
          </div>

          <div>
            <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-slate-700">
              Age
            </label>
            <input
              id="age"
              type="number"
              min="18"
              max="100"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
              placeholder="28"
              {...register("age", {
                valueAsNumber: true,
                min: { value: 18, message: "Age must be at least 18" },
                max: { value: 100, message: "Age cannot exceed 100" },
              })}
            />
            {errors.age ? <p className="mt-1 text-xs text-rose-500">{errors.age.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || selectedServices.length === 0}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving profile..." : "Save provider profile"}
          </button>

          {apiError ? <p className="text-center text-sm text-rose-600">{apiError}</p> : null}
          {apiSuccess ? <p className="text-center text-sm text-emerald-600">{apiSuccess}</p> : null}
        </form>
      </div>
    </main>
  );
}
