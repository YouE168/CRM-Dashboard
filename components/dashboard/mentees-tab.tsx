"use client";

import { ParticipantAccessTab } from "./participant-access-tab";

// Only accounts whose primary_role is "mentee" - pure entrepreneur
// accounts don't have a mentee page, so they don't belong here (they show
// up in the Entrepreneurs tab instead).
export function MenteesTab() {
  return (
    <ParticipantAccessTab
      title="Mentees"
      description="Every mentee account and which programs they're approved for. Every mentee also gets an Entrepreneur Hub view on their own dashboard (a toggle on the same account) - manage that side from the Entrepreneurs tab."
      emptyLabel="No mentee accounts yet."
      filter={(row) => row.primaryRole === "mentee"}
    />
  );
}
