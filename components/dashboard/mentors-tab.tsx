"use client";

import { useState, useEffect } from "react";
import { KPICard } from "./kpi-card";
import { Users, UserCheck, Heart, Award } from "lucide-react";
import { loadCMSData } from "@/lib/cms-data";

const mentors = [
  {
    name: "Michael Chen",
    specialty: "Business Strategy",
    clients: 8,
    rating: 4.9,
    status: "Active",
  },
  {
    name: "Lisa Thompson",
    specialty: "Youth Development",
    clients: 6,
    rating: 4.7,
    status: "Active",
  },
  {
    name: "David Park",
    specialty: "Entrepreneurship",
    clients: 5,
    rating: 4.8,
    status: "Active",
  },
  {
    name: "Jennifer Lee",
    specialty: "Veterans Affairs",
    clients: 7,
    rating: 4.6,
    status: "Active",
  },
  {
    name: "Tom Anderson",
    specialty: "Finance",
    clients: 4,
    rating: 4.5,
    status: "Active",
  },
  {
    name: "Susan White",
    specialty: "Leadership",
    clients: 6,
    rating: 4.9,
    status: "On Leave",
  },
  {
    name: "Chris Taylor",
    specialty: "Marketing",
    clients: 5,
    rating: 4.7,
    status: "Active",
  },
  {
    name: "Rachel Green",
    specialty: "Operations",
    clients: 3,
    rating: 4.8,
    status: "Active",
  },
];

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function initials(name: string) {
  const p = name.split(" ");
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0][0];
}

export function MentorsTab() {
  const [cmsData, setCmsData] = useState(loadCMSData());

  useEffect(() => {
    setCmsData(loadCMSData());
  }, []);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentors</h1>
        <p className="text-sm text-gray-500 mt-1">
          {cmsData.mentors.total} mentors · {cmsData.mentors.active} currently
          active
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Mentors"
          value={cmsData.mentors.total}
          icon={Users}
        />
        <KPICard
          title="Active Mentors"
          value={cmsData.mentors.active}
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="Active Matches"
          value={cmsData.mentors.activeMatches}
          icon={Heart}
          trend={{ value: cmsData.mentors.matchesTrend, isPositive: true }}
          subtitle="paired"
        />
        <KPICard
          title="Avg. Rating"
          value={`${cmsData.mentors.avgRating}★`}
          icon={Award}
          variant="success"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Mentor Directory
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Mentor",
                  "Specialty",
                  "Active Clients",
                  "Rating",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mentors.map((m, i) => (
                <tr key={m.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}
                      >
                        {initials(m.name)}
                      </div>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {m.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{m.specialty}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {m.clients}
                  </td>
                  <td className="px-5 py-3 text-amber-600 font-medium">
                    {m.rating}★
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${m.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
