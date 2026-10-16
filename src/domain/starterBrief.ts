export interface BriefGroup { heading: string; items: string[]; }

export function buildRuleBasedBrief(notes: string, employeeName: string, role: string, manager: string): BriefGroup[] {
  const sentences = notes.split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter(Boolean);
  const take = (pattern: RegExp) => sentences.filter((sentence) => pattern.test(sentence)).slice(0, 5);
  const fallback = (message: string) => [`Needs confirmation: ${message}`];
  return [
    { heading: 'Role summary', items: [`${employeeName || 'Employee'} is starting as ${role || 'a role that needs confirmation'}.`, ...take(/responsib|role|support|will include/i).slice(0, 2)] },
    { heading: 'Immediate tasks', items: take(/first|priority|complete|confirm|review|test/i).length ? take(/first|priority|complete|confirm|review|test/i) : fallback('first-day priorities were not found in the notes.') },
    { heading: 'Contacts', items: take(/contact|manager|lead|buddy|team|ask/i).length ? take(/contact|manager|lead|buddy|team|ask/i) : fallback(`contacts beyond ${manager || 'the manager'} were not identified.`) },
    { heading: 'Procedures', items: take(/procedure|process|checklist|guide|step|approval/i).length ? take(/procedure|process|checklist|guide|step|approval/i) : fallback('operating procedures were not identified.') },
    { heading: 'Useful references', items: take(/document|knowledge|reference|link|resource|folder|guide/i).length ? take(/document|knowledge|reference|link|resource|folder|guide/i) : fallback('useful references were not identified.') },
    { heading: 'Unresolved questions', items: take(/question|pending|open item|missing|confirm|whether|\?/i).length ? take(/question|pending|open item|missing|confirm|whether|\?/i).map((item) => `Needs confirmation: ${item}`) : fallback('no unresolved questions were explicitly captured.') },
  ];
}
