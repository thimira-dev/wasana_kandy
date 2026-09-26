"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Store,
  ArrowRight,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { isValidSriLankanPhone, normalizeSriLankanPhone } from "@/lib/domain/phone-rules";
import { getEarliestReadyDate, validateReadyDate } from "@/lib/domain/date-rules";

export interface BranchData {
  id: string;
  code: string;
  name: string;
  address: string;
  phone?: string | null;
}

export interface StoredCheckoutDetails {
  customerName: string;
  customerEmail: string;
  phonePrimary: string;
  phoneSecondary?: string;
  branchId: string;
  readyDate: string;
}

interface CheckoutDetailsFormProps {
  branches: BranchData[];
}

export function CheckoutDetailsForm({ branches }: CheckoutDetailsFormProps) {
  const router = useRouter();

  // Earliest date allowed (at least 4 calendar days in Asia/Colombo)
  const earliestDate = getEarliestReadyDate();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [readyDate, setReadyDate] = useState(earliestDate);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore stored details if returning from review page
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("wasana_checkout_details");
        if (saved) {
          const parsed: StoredCheckoutDetails = JSON.parse(saved);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.customerEmail) setCustomerEmail(parsed.customerEmail);
          if (parsed.phonePrimary) setPhonePrimary(parsed.phonePrimary);
          if (parsed.phoneSecondary) setPhoneSecondary(parsed.phoneSecondary);
          if (parsed.branchId && branches.some((b) => b.id === parsed.branchId)) {
            setBranchId(parsed.branchId);
          }
          if (parsed.readyDate && parsed.readyDate >= earliestDate) {
            setReadyDate(parsed.readyDate);
          }
        }
      } catch (err) {
        console.error("Error restoring checkout details:", err);
      }
    }
  }, [branches, earliestDate]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = "Please enter your full name.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      errs.customerEmail = "Please enter a valid email address.";
    }

    if (!phonePrimary.trim()) {
      errs.phonePrimary = "Please enter your primary contact number.";
    } else if (!isValidSriLankanPhone(phonePrimary)) {
      errs.phonePrimary = "Please enter a valid Sri Lankan phone number (e.g. 0771234567 or +94771234567).";
    }

    if (phoneSecondary.trim() && !isValidSriLankanPhone(phoneSecondary)) {
      errs.phoneSecondary = "Secondary number must be a valid Sri Lankan phone number.";
    }

    if (!branchId) {
      errs.branchId = "Please select a pickup branch.";
    }

    const dateCheck = validateReadyDate(readyDate);
    if (!dateCheck.isValid) {
      errs.readyDate = dateCheck.error || "Please select a valid ready date.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const checkoutDetails: StoredCheckoutDetails = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      phonePrimary: normalizeSriLankanPhone(phonePrimary),
      phoneSecondary: phoneSecondary.trim() ? normalizeSriLankanPhone(phoneSecondary) : undefined,
      branchId,
      readyDate,
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("wasana_checkout_details", JSON.stringify(checkoutDetails));
      } catch (err) {
        console.error("Failed to save checkout details:", err);
      }
    }

    router.push("/checkout/review");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SECTION 1: Customer Contact Information */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            <span>Customer Contact Information</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            We will use these details to contact you regarding your cake preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Full Name <span className="text-amber-700">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: "" }));
                }}
                placeholder="e.g. Kasun Perera"
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-all ${
                  errors.customerName
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                }`}
              />
            </div>
            {errors.customerName && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.customerName}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Email Address <span className="text-amber-700">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (errors.customerEmail) setErrors((prev) => ({ ...prev, customerEmail: "" }));
                }}
                placeholder="e.g. kasun@example.com"
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-all ${
                  errors.customerEmail
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                }`}
              />
            </div>
            {errors.customerEmail && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.customerEmail}</span>
              </p>
            )}
            <p className="text-[11px] text-stone-400 mt-1">
              Your order confirmation and receipt will be sent to this email address.
            </p>
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Primary Contact Number <span className="text-amber-700">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phonePrimary}
                onChange={(e) => {
                  setPhonePrimary(e.target.value);
                  if (errors.phonePrimary) setErrors((prev) => ({ ...prev, phonePrimary: "" }));
                }}
                placeholder="077 123 4567"
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-all font-mono ${
                  errors.phonePrimary
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                }`}
              />
            </div>
            {errors.phonePrimary && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phonePrimary}</span>
              </p>
            )}
            <p className="text-[11px] text-stone-400 mt-1">
              Accepts 07XXXXXXXX or +947XXXXXXXX
            </p>
          </div>

          {/* Secondary Phone (Optional) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Secondary Contact Number <span className="text-stone-400">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phoneSecondary}
                onChange={(e) => {
                  setPhoneSecondary(e.target.value);
                  if (errors.phoneSecondary) setErrors((prev) => ({ ...prev, phoneSecondary: "" }));
                }}
                placeholder="081 223 4567"
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-all font-mono ${
                  errors.phoneSecondary
                    ? "border-rose-400 focus:ring-rose-200"
                    : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
                }`}
              />
            </div>
            {errors.phoneSecondary && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phoneSecondary}</span>
              </p>
            )}
            <p className="text-[11px] text-stone-400 mt-1">
              Alternative number for delivery coordinator
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Pickup Branch Selection */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Pickup Branch</span> <span className="text-amber-700">*</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Select the Wasana Bakers outlet in Kandy where you will collect your cake.
          </p>
        </div>

        {errors.branchId && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.branchId}</span>
          </p>
        )}

        <div className="space-y-3">
          {branches.map((branch) => {
            const isSelected = branchId === branch.id;
            return (
              <label
                key={branch.id}
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-amber-600 bg-amber-50/70 ring-1 ring-amber-600 shadow-xs"
                    : "border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="branchSelection"
                  value={branch.id}
                  checked={isSelected}
                  onChange={() => {
                    setBranchId(branch.id);
                    if (errors.branchId) setErrors((prev) => ({ ...prev, branchId: "" }));
                  }}
                  className="mt-1 w-4 h-4 text-amber-600 border-stone-300 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900">
                      {branch.name}
                    </span>
                    <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-sm">
                      {branch.code}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </p>
                  {branch.phone && (
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{branch.phone}</span>
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Cake Ready Date */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Cake Ready Date</span> <span className="text-amber-700">*</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Select the date you need your cake ready for collection.
          </p>
        </div>

        <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Minimum 4-Day Handcrafted Preparation Rule</p>
            <p className="text-amber-800 leading-relaxed">
              Every celebration cake is freshly baked and petal-piped upon order. To maintain Wasana quality standards,
              orders require at least <strong>4 calendar days</strong> of notice.
              The earliest pickup date for orders placed today is <strong>{earliestDate}</strong>.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Pickup Date <span className="text-amber-700">*</span>
          </label>
          <div className="relative max-w-xs">
            <input
              type="date"
              required
              min={earliestDate}
              value={readyDate}
              onChange={(e) => {
                setReadyDate(e.target.value);
                if (errors.readyDate) setErrors((prev) => ({ ...prev, readyDate: "" }));
              }}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-all ${
                errors.readyDate
                  ? "border-rose-400 focus:ring-rose-200"
                  : "border-stone-300 focus:border-amber-600 focus:ring-amber-100"
              }`}
            />
          </div>
          {errors.readyDate && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.readyDate}</span>
            </p>
          )}
        </div>
      </div>

      {/* Submit / Continue Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 cursor-pointer disabled:opacity-50"
        >
          <span>Continue to Order Review</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
