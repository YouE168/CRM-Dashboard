"use client";

import { ParticipantAccessTab } from "./participant-access-tab";

// Pure "entrepreneur" primary_role accounts, plus every "mentee" account -
// mentees can toggle into an Entrepreneur Hub view of their own dashboard
// (same account, same user_programs), so they show up here too. A pure
// entrepreneur account only ever has its own entrepreneur page.
export function EntrepreneursTab() {
  return (
    <ParticipantAccessTab
      title="Entrepreneurs"
      description="Every account with an Entrepreneur Hub view and which programs they're approved for - entrepreneur signups, plus mentees (who can toggle into this same view from their own dashboard)."
      emptyLabel="No entrepreneur accounts yet."
      filter={(row) => row.primaryRole === "entrepreneur" || row.primaryRole === "mentee"}
    />
  );
}
