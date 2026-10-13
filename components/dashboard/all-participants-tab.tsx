"use client";

import { ParticipantAccessTab } from "./participant-access-tab";

// One combined list of every mentee and entrepreneur account (including
// accounts that have both), with search, a program filter, and each
// person's approved programs shown right in the list.
export function AllParticipantsTab() {
  return (
    <ParticipantAccessTab
      title="All Participants"
      description="Every mentee and entrepreneur in one place - search, filter by program, and click a person to approve or revoke their program access."
      emptyLabel="No participant accounts yet."
      filter={() => true}
      showControls
    />
  );
}
