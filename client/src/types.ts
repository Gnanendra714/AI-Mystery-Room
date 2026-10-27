export type EvidenceType='chat_transcript'|'image'|'camera_log'|'witness_statement'|'document'|'call_log'|'timeline_entry';
export type Suspect={id:string;name:string;profile:string;relationship:string;motive:string;alibi:string;suspicionReason:string;evidenceIds:string[]};
export type Evidence={id:string;type:EvidenceType;title:string;summary:string;content:string|Record<string,unknown>;sourceDescription:string;suspectIds:string[]};
export type CaseFile={id:string;caseCode:string;title:string;difficulty:string;theme:string;premise:string;briefing:string;setting:string;incident:string;suspects:Suspect[];evidence:Evidence[];timeline:{id:string;timestamp:string;description:string}[]};
export type Result={verdict:'correct'|'incorrect';selectedSuspectId:string;culprit:{id:string;name:string};solutionSummary:string;solutionExplanation:string;decisiveEvidence:{id:string;title:string;explanation:string}[];suspectReasoning:{suspectId:string;reasoning:string}[]};
