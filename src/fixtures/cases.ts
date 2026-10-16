import { scenarios, type FormState } from '../data';

export type CaseStatus = 'Active' | 'Waiting' | 'At Risk' | 'Completed';
export interface FixtureCase {
  id: string; form: FormState; status: CaseStatus; blocker: string; lastUpdated: string;
  bundleGenerated: boolean; submitted: boolean; briefGenerated: boolean;
  source: 'fixture'; readiness: number;
}

export const fixtureCases: FixtureCase[] = [
  { id: 'ONB-FICTIONAL-MARYAM', form: scenarios.newhire.form, status: 'Waiting', blocker: 'Application access verification', lastUpdated: '2026-10-16', bundleGenerated: true, submitted: false, briefGenerated: false, source: 'fixture', readiness: 50 },
  { id: 'ONB-FICTIONAL-JIM', form: scenarios.transfer.form, status: 'Active', blocker: 'Previous access review', lastUpdated: '2026-10-16', bundleGenerated: true, submitted: false, briefGenerated: true, source: 'fixture', readiness: 50 },
];

