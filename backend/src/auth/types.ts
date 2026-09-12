export const PROTOCOL_ROLES = [
  'PROJECT_PROPONENT',
  'INDEPENDENT_VERIFIER',
  'CORPORATE_BUYER',
  'REGULATOR_AUDITOR'
] as const;

export type ProtocolRole = (typeof PROTOCOL_ROLES)[number];

export interface AuthenticatedUser {
  id: string;
  loginId: string;
  displayName: string;
  organization: string;
  role: ProtocolRole;
  walletAddress: string | null;
}

export interface SessionPayload extends AuthenticatedUser {
  iat: number;
  exp: number;
}
