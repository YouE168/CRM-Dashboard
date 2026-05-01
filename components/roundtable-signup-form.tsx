"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { COUNTY_LIST } from "@/lib/constants";

export function RoundtableSignupForm({
  profileName,
  profileEmail,
  onSuccess,
}: {
  profileName: string;
  profileEmail: string;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState({
    name: profileName,
    email: profileEmail,
    org: "",
    county: "",
    role: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Check className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">
          You're on the list!
        </h3>
        <p className="text-sm text-gray-500">
          We'll be in touch within 3 business days.
        </p>
      </div>
    );
  }
  const counties = COUNTY_LIST;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Organization / Business
          </label>
          <input
            type="text"
            placeholder="Where do you work or serve?"
            value={form.org}
            onChange={(e) => setForm((p) => ({ ...p, org: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            County
          </label>
          <select
            value={form.county}
            onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">Select county…</option>
            {counties.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Your Role / Title
        </label>
        <input
          type="text"
          placeholder="e.g. Small Business Owner, Nonprofit Director…"
          value={form.role}
          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Why do you want to join?
        </label>
        <textarea
          rows={3}
          placeholder="Tell us a little about your goals and what you'd bring to the roundtable…"
          value={form.reason}
          onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (form.name && form.email && form.county) {
            setSubmitted(true);
            onSuccess?.();
          }
        }}
        className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Submit Application
      </button>
      {(!form.name || !form.email || !form.county) && (
        <p className="text-xs text-gray-400 text-center">
          Name, email, and county are required.
        </p>
      )}
    </div>
  );
}
