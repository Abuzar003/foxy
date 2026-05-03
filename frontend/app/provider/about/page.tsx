"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiRequest, ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const linkClass = "font-medium text-primary transition-smooth hover:opacity-90";

const inputClass =
  "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground shadow-sm transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/80";

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
      router.replace("/auth/login/provider");
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
        router.replace("/auth/login/provider");
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
      <AuthShell maxWidthClass="max-w-3xl">
        <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
          <p className="text-center text-sm text-muted-foreground">Loading provider profile…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell maxWidthClass="max-w-3xl">
      <div className="rounded-2xl border border-border bg-card-gradient p-8 shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal">
          Provider profile
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Your <span className="text-gradient-gold">about</span> and services
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete your profile so customers can trust and book your services. Use the same details you would on signup.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="aadhaarNumber" className="mb-1.5 block text-sm font-medium text-foreground">
                Aadhaar number
              </label>
              <input
                id="aadhaarNumber"
                className={inputClass}
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
                <p className="mt-1 text-xs text-destructive">{errors.aadhaarNumber.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="panCard" className="mb-1.5 block text-sm font-medium text-foreground">
                PAN card (optional)
              </label>
              <input
                id="panCard"
                className={cn(inputClass, "uppercase")}
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
              {errors.panCard ? <p className="mt-1 text-xs text-destructive">{errors.panCard.message}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-foreground">
              Complete address
            </label>
            <textarea
              id="address"
              rows={3}
              className={cn(inputClass, "min-h-[5.5rem] resize-y")}
              placeholder="House number, street, area, city, state, pincode"
              {...register("address", {
                required: "Address is required",
                minLength: { value: 10, message: "Address should be at least 10 characters" },
              })}
            />
            {errors.address ? <p className="mt-1 text-xs text-destructive">{errors.address.message}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Services</label>
            <p className="mb-2 text-xs text-muted-foreground">
              Select every service you offer. These match what customers can search for.
            </p>
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3.5">
              {Object.entries(taxonomy).map(([category, services]) => (
                <div key={category} className="rounded-lg border border-border bg-background p-3">
                  <p className="mb-2 text-sm font-semibold text-foreground">{category}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {services.map((service) => {
                      const checked = selectedServices.includes(service);
                      return (
                        <label
                          key={service}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
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
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                          />
                          <span className="text-foreground">{service}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length === 0 ? (
              <p className="mt-1 text-xs text-destructive">Select at least one service.</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pricePerDay" className="mb-1.5 block text-sm font-medium text-foreground">
                Price per day
              </label>
              <input
                id="pricePerDay"
                type="number"
                step="0.01"
                min="1"
                className={inputClass}
                placeholder="1200"
                {...register("pricePerDay", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Price per day must be greater than 0" },
                })}
              />
              {errors.pricePerDay ? (
                <p className="mt-1 text-xs text-destructive">{errors.pricePerDay.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="pricePerHour" className="mb-1.5 block text-sm font-medium text-foreground">
                Price per hour
              </label>
              <input
                id="pricePerHour"
                type="number"
                step="0.01"
                min="1"
                className={inputClass}
                placeholder="250"
                {...register("pricePerHour", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Price per hour must be greater than 0" },
                })}
              />
              {errors.pricePerHour ? (
                <p className="mt-1 text-xs text-destructive">{errors.pricePerHour.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="profilePhoto" className="mb-1.5 block text-sm font-medium text-foreground">
              Profile photo URL
            </label>
            <input
              id="profilePhoto"
              className={inputClass}
              placeholder="https://example.com/photo.jpg"
              {...register("profilePhoto", {
                required: "Profile photo URL is required",
                minLength: { value: 3, message: "Provide a valid photo URL" },
              })}
            />
            {errors.profilePhoto ? (
              <p className="mt-1 text-xs text-destructive">{errors.profilePhoto.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="about" className="mb-1.5 block text-sm font-medium text-foreground">
              About
            </label>
            <textarea
              id="about"
              rows={4}
              className={cn(inputClass, "min-h-[7rem] resize-y")}
              placeholder="Tell customers about your experience and quality standards."
              {...register("about", {
                required: "About section is required",
                minLength: { value: 10, message: "About must be at least 10 characters" },
              })}
            />
            {errors.about ? <p className="mt-1 text-xs text-destructive">{errors.about.message}</p> : null}
          </div>

          <div>
            <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-foreground">
              Age
            </label>
            <input
              id="age"
              type="number"
              min="18"
              max="100"
              className={inputClass}
              placeholder="28"
              {...register("age", {
                valueAsNumber: true,
                min: { value: 18, message: "Age must be at least 18" },
                max: { value: 100, message: "Age cannot exceed 100" },
              })}
            />
            {errors.age ? <p className="mt-1 text-xs text-destructive">{errors.age.message}</p> : null}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || selectedServices.length === 0}
            className="h-11 w-full rounded-xl bg-gold-gradient text-sm font-semibold text-primary-foreground shadow-gold transition-smooth hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving profile…" : "Save provider profile"}
          </Button>

          {apiError ? <p className="text-center text-sm text-destructive">{apiError}</p> : null}
          {apiSuccess ? (
            <p className="text-center text-sm font-medium text-teal">{apiSuccess}</p>
          ) : null}
        </form>

        <div className="mt-8 space-y-3 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/inbox/provider" className={linkClass}>
              Provider inbox
            </Link>
          </p>
          <p>
            <Link href="/" className={linkClass}>
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
