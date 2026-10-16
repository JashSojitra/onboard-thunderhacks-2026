import { z } from 'zod';

export const transitionKindSchema = z.enum(['new_hire', 'internal_transfer']);
export const caseStatusSchema = z.enum(['Active', 'Waiting', 'At Risk', 'Completed']);
export const ticketStatusSchema = z.enum([
  'draft-ready', 'optional', 'needs-approval', 'attention', 'submitted',
  'pending-approval', 'in-progress', 'waiting', 'not-started', 'complete',
]);

const optionalText = z.string().trim().max(200).default('');
const caseInputBaseSchema = z.object({
  employeeName: z.string().trim().min(1).max(120),
  transitionKind: transitionKindSchema,
  previousOrgUnit: optionalText,
  destinationOrgUnit: z.string().trim().min(1).max(120),
  destinationTeam: optionalText,
  roleTitle: z.string().trim().min(1).max(160),
  startDate: z.string().date(),
  location: z.string().trim().min(1).max(200),
  managerName: z.string().trim().min(1).max(120),
  requirements: z.object({
    laptop: z.boolean(), sharedDrive: z.boolean(), teams: z.boolean(),
    distributionList: z.boolean(), mobile: z.boolean(), admin: z.boolean(),
    building: z.boolean(), printer: z.boolean(),
  }).strict(),
}).strict();

export const caseInputSchema = caseInputBaseSchema.superRefine((value, ctx) => {
  if (value.transitionKind === 'internal_transfer' && !value.previousOrgUnit) {
    ctx.addIssue({ code: 'custom', path: ['previousOrgUnit'], message: 'Previous organization is required for an internal transfer.' });
  }
});

export const createCaseSchema = caseInputSchema;
export const updateCaseSchema = caseInputBaseSchema.partial().extend({ status: caseStatusSchema.optional() }).strict();
export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  name: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  approvalPath: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  included: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== 'note'), { message: 'Provide a ticket field to update.' });
export const prerequisiteStatusSchema = z.enum(['unknown', 'blocked', 'verified']);
export const updatePrerequisiteSchema = z.object({
  status: prerequisiteStatusSchema,
  owner: z.string().trim().min(1).max(160),
  evidence: z.string().trim().max(1000).default(''),
}).strict().superRefine((value, ctx) => {
  if (value.status === 'verified' && !value.evidence) {
    ctx.addIssue({ code: 'custom', path: ['evidence'], message: 'Evidence is required before verification.' });
  }
});
export const sessionSchema = z.object({ accessCode: z.string().min(8).max(200) }).strict();

export type CaseInput = z.infer<typeof caseInputSchema>;
export type TransitionKind = z.infer<typeof transitionKindSchema>;

