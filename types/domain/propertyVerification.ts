export type VerificationEvidence = {
  id: string;
  type: string;
  name: string;
  mime_type: string;
  size: number;
};
export type VerificationRecord = {
  id: string;
  property_id: string;
  property_title: string;
  level: string;
  status: string;
  property: {
    owner_id: string;
    location: string;
    type: string;
    listing_type: string;
    sqm: number | null;
    area: string | null;
    lat: string;
    lng: string;
  };
  submitted_at: string | null;
  expires_at: string | null;
  evidence: VerificationEvidence[];
  allowed_actions: string[];
  history: Array<{
    id: string;
    action: string;
    actor_role: string;
    actor_id: string;
    reason: string | null;
    effective_at: string;
  }>;
};
export type VerificationPolicy = {
  levels: Record<
    string,
    { label: string; required_evidence: string[]; valid_days: number }
  >;
  evidence_types: Record<string, string>;
  max_file_kb: number;
  max_files: number;
};
export type VerificationPage = {
  records: VerificationRecord[];
  next_page: number | null;
  policy: VerificationPolicy;
};
export type PropertyVerificationState = VerificationPage & {
  is_verified: boolean;
  is_published: boolean;
  availability: { from: string | null; until: string | null };
  eligibility_reasons: string[];
};
