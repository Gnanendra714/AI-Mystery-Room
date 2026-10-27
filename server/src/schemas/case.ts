import { z } from 'zod';

export const difficulties = ['easy', 'medium', 'hard'] as const;
export const themes = ['classic_detective', 'locked_room', 'workplace_mystery', 'historical_fiction', 'sci_fi', 'campus_mystery', 'custom'] as const;
export const evidenceTypes = ['chat_transcript', 'image', 'camera_log', 'witness_statement', 'document', 'call_log', 'timeline_entry'] as const;
export const createCaseSchema = z.object({ storySeed: z.string().trim().min(20).max(1500), difficulty: z.enum(difficulties).default('medium'), theme: z.enum(themes).default('classic_detective') }).strict();
const shortText = (max = 1200) => z.string().trim().min(1).max(max);
export const suspectSchema = z.object({ id: shortText(60), name: shortText(100), profile: shortText(700), relationship: shortText(300), motive: shortText(500), alibi: shortText(500), suspicionReason: shortText(500), evidenceIds: z.array(shortText(60)).min(1).max(12) }).strict();
export const evidenceSchema = z.object({ id: shortText(60), type: z.enum(evidenceTypes), title: shortText(120), summary: shortText(300), content: z.union([shortText(2000), z.record(z.string(), z.unknown())]), sourceDescription: shortText(300), suspectIds: z.array(shortText(60)).max(5), classification: z.enum(['decisive','supporting','red_herring']) }).strict();
export const timelineSchema = z.object({ id: shortText(60), timestamp: shortText(80), description: shortText(500) }).strict();
export const generatedCaseSchema = z.object({ title: shortText(120), difficulty: z.enum(difficulties), theme: z.enum(themes), premise: shortText(500), briefing: shortText(1200), setting: shortText(500), incident: shortText(800), suspects: z.array(suspectSchema).min(3).max(5), evidence: z.array(evidenceSchema).min(5).max(12), timeline: z.array(timelineSchema).min(2).max(15), culpritSuspectId: shortText(60), solutionSummary: shortText(500), solutionExplanation: shortText(1600), decisiveEvidenceIds: z.array(shortText(60)).min(2).max(5), suspectReasoning: z.array(z.object({ suspectId: shortText(60), reasoning: shortText(600), ruledOutByEvidenceIds: z.array(shortText(60)).max(12) }).strict()).min(3).max(5) }).strict();
export type GeneratedCase = z.infer<typeof generatedCaseSchema>;
const ranges = { easy: { suspects: [3,3], evidence: [5,7] }, medium: { suspects: [4,4], evidence: [7,9] }, hard: { suspects: [5,5], evidence: [9,12] } } as const;
export function validateFairCase(input: unknown, difficulty?: string, theme?: string): GeneratedCase {
  const c = generatedCaseSchema.parse(input); const range = ranges[difficulty as keyof typeof ranges] ?? ranges[c.difficulty];
  const ids = (items: {id:string}[]) => new Set(items.map(x => x.id));
  const suspectIds = ids(c.suspects), evidenceIds = ids(c.evidence), timelineIds = ids(c.timeline);
  if (suspectIds.size !== c.suspects.length || evidenceIds.size !== c.evidence.length || timelineIds.size !== c.timeline.length) throw new Error('Duplicate IDs');
  if (difficulty && c.difficulty !== difficulty || theme && c.theme !== theme) throw new Error('Case settings do not match request');
  if (c.suspects.length < range.suspects[0] || c.suspects.length > range.suspects[1] || c.evidence.length < range.evidence[0] || c.evidence.length > range.evidence[1]) throw new Error('Counts do not match difficulty');
  if (!suspectIds.has(c.culpritSuspectId)) throw new Error('Unknown culprit');
  for (const e of c.evidence) if (e.suspectIds.some(id => !suspectIds.has(id))) throw new Error('Unknown evidence suspect');
  for (const s of c.suspects) if (s.evidenceIds.some(id => !evidenceIds.has(id))) throw new Error('Unknown suspect evidence');
  if (c.decisiveEvidenceIds.some(id => !evidenceIds.has(id)) || new Set(c.decisiveEvidenceIds).size < 2) throw new Error('Invalid decisive evidence');
  if (c.evidence.filter(e => c.decisiveEvidenceIds.includes(e.id) && e.suspectIds.includes(c.culpritSuspectId)).length < 2) throw new Error('At least two decisive clues must connect to the culprit');
  if (c.suspectReasoning.length !== c.suspects.length || c.suspectReasoning.some(r => !suspectIds.has(r.suspectId) || r.ruledOutByEvidenceIds.some(id => !evidenceIds.has(id)))) throw new Error('Invalid suspect reasoning references');
  return c;
}
