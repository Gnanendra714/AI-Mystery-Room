import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { createCaseSchema, validateFairCase, type GeneratedCase } from './schemas/case.js';
import { createFixture } from './services/case/fixture.js';
import { generateWithGemini, GenerationFailure } from './services/ai/gemini.js';
import { MysteryCase } from './models/MysteryCase.js';
import { CaseAttempt } from './models/CaseAttempt.js';

type StoredCase = GeneratedCase & { id:string; caseCode:string; providerModel:string };
const memoryCases = new Map<string,StoredCase>();
const memoryAttempts = new Map<string,unknown>();
const useMongo=Boolean(env.mongoUri)&&env.nodeEnv!=='test';
const publicCase = (c:StoredCase | (Record<string,any> & {id:string})) => ({
  id:c.id, caseCode:c.caseCode, title:c.title, difficulty:c.difficulty, theme:c.theme, premise:c.premise, briefing:c.briefing, setting:c.setting, incident:c.incident,
  suspects:c.suspects.map((s:any)=>({id:s.id,name:s.name,profile:s.profile,relationship:s.relationship,motive:s.motive,alibi:s.alibi,suspicionReason:s.suspicionReason,evidenceIds:s.evidenceIds})),
  evidence:c.evidence.map((e:any)=>({id:e.id,type:e.type,title:e.title,summary:e.summary,content:e.content,sourceDescription:e.sourceDescription,suspectIds:e.suspectIds})), timeline:c.timeline
});
const requestId = (req:Request,res:Response,next:NextFunction)=>{req.headers['x-request-id']=randomUUID();res.setHeader('x-request-id',String(req.headers['x-request-id']));next();};
const asyncRoute = (fn:(req:Request,res:Response,next:NextFunction)=>Promise<unknown>) => (req:Request,res:Response,next:NextFunction)=>{void fn(req,res,next).catch(next);};
function findMemoryCase(id:string){ return memoryCases.get(id) ?? [...memoryCases.values()].find(c=>c.caseCode===id); }
async function findCase(id:string):Promise<StoredCase | null>{
  const local=findMemoryCase(id); if(local)return local;
  if(!useMongo || !Types.ObjectId.isValid(id))return null;
  const doc:any=await MysteryCase.findById(id).lean(); if(!doc || doc.status!=='ready')return null;
  const solution=doc.solution ?? {};
  return {id:String(doc._id),caseCode:doc.caseCode,title:doc.title,difficulty:doc.difficulty,theme:doc.theme,premise:doc.premise,briefing:doc.briefing,setting:doc.setting,incident:doc.incident,suspects:doc.suspects,evidence:doc.evidence,timeline:doc.timeline,culpritSuspectId:solution.culpritSuspectId,solutionSummary:solution.summary,solutionExplanation:solution.explanation,decisiveEvidenceIds:solution.decisiveEvidenceIds,suspectReasoning:solution.suspectReasoning,providerModel:doc.providerModel ?? ''} as StoredCase;
}
export const app=express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({origin:env.clientOrigin.split(',').map(x=>x.trim()),methods:['GET','POST'],allowedHeaders:['Content-Type']}));
app.use(express.json({limit:'20kb'}));
app.use(requestId);
app.get('/api/v1/health',(_req,res)=>res.json({status:'ok'}));
const generationLimit=env.nodeEnv==='test'?1000:env.rateMax;
const generationLimiter=rateLimit({windowMs:env.rateWindowMs,limit:generationLimit,standardHeaders:true,legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Please wait before creating another case.'}}});
const accusationLimiter=rateLimit({windowMs:env.rateWindowMs,limit:generationLimit*3,standardHeaders:true,legacyHeaders:false});
app.post('/api/v1/cases',generationLimiter,asyncRoute(async(req,res)=>{
  const parsed=createCaseSchema.safeParse(req.body);
  if(!parsed.success) throw Object.assign(new Error('Please provide a story premise between 20 and 1500 characters and valid case settings.'),{status:400,code:'VALIDATION_ERROR'});
  const {storySeed,difficulty,theme}=parsed.data;
  let generated:GeneratedCase;
  try{
    if(env.geminiApiKey&&env.nodeEnv!=='test') generated=await generateWithGemini(storySeed,difficulty,theme);
    else if(env.nodeEnv!=='production') generated=validateFairCase(createFixture(difficulty,theme,storySeed),difficulty,theme);
    else throw Object.assign(new Error('AI generation is not configured.'),{status:503,code:'AI_UNAVAILABLE'});
  }catch(error){
    if((error as any)?.status)throw error;
    const diagnostic=error instanceof GenerationFailure?error.diagnostic():{failureCategory:'CASE_PREPARATION_ERROR',stage:'fixture-validation',attempts:0,errorName:error instanceof Error?error.name:'UnknownError'};
    throw Object.assign(new Error('We could not prepare a consistent case. Please try again.'),{status:502,code:diagnostic.failureCategory,diagnostic});
  }
  const id=useMongo?new Types.ObjectId().toString():randomUUID();
  const caseCode=randomUUID().split('-')[0]!.toUpperCase();
  const stored:StoredCase={...generated,id,caseCode,providerModel:env.geminiApiKey&&env.nodeEnv!=='test'?env.geminiModel:'local-fixture'};
  if(useMongo){ await MysteryCase.create({_id:id,caseCode,title:generated.title,difficulty,theme,premise:generated.premise,briefing:generated.briefing,setting:generated.setting,incident:generated.incident,suspects:generated.suspects,evidence:generated.evidence,timeline:generated.timeline,solution:{culpritSuspectId:generated.culpritSuspectId,summary:generated.solutionSummary,explanation:generated.solutionExplanation,decisiveEvidenceIds:generated.decisiveEvidenceIds,suspectReasoning:generated.suspectReasoning},generationVersion:'1.0.0',providerModel:stored.providerModel,status:'ready'}); }
  else memoryCases.set(id,stored);
  return res.status(201).json({case:publicCase(stored)});
}));
app.get('/api/v1/cases/:caseId',asyncRoute(async(req,res)=>{
  const c=await findCase(String(req.params.caseId ?? '')); if(!c)throw Object.assign(new Error('This case could not be found.'),{status:404,code:'CASE_NOT_FOUND'});
  return res.json({case:publicCase(c)});
}));
app.post('/api/v1/cases/:caseId/accusation',accusationLimiter,asyncRoute(async(req,res)=>{
  if(!req.body || typeof req.body.suspectId!=='string' || !req.body.suspectId.trim())throw Object.assign(new Error('Choose one suspect before submitting.'),{status:400,code:'VALIDATION_ERROR'});
  const c=await findCase(String(req.params.caseId ?? '')); if(!c)throw Object.assign(new Error('This case could not be found.'),{status:404,code:'CASE_NOT_FOUND'});
  const suspectId=req.body.suspectId;
  if(!c.suspects.some(s=>s.id===suspectId))throw Object.assign(new Error('That suspect is not part of this case.'),{status:404,code:'SUSPECT_NOT_FOUND'});
  const existing=memoryAttempts.get(c.id) ?? (useMongo?await CaseAttempt.findOne({caseId:c.id}).lean():null);
  if(existing){const prior:any=existing; if(prior.result)return res.json({result:prior.result}); throw Object.assign(new Error('An accusation has already been submitted for this case.'),{status:409,code:'ACCUSATION_ALREADY_SUBMITTED'});}
  const culprit=c.suspects.find(s=>s.id===c.culpritSuspectId)!;
  const result={verdict:suspectId===c.culpritSuspectId?'correct':'incorrect',selectedSuspectId:suspectId,culprit:{id:culprit.id,name:culprit.name},solutionSummary:c.solutionSummary,solutionExplanation:c.solutionExplanation,decisiveEvidence:c.evidence.filter(e=>c.decisiveEvidenceIds.includes(e.id)).map(e=>({id:e.id,title:e.title,explanation:e.id==='e-access'?'This independent access record places the conservator credential at the service passage during the removal.':'The staff exchange shows the padded case was prepared before the clock vanished.'})),suspectReasoning:c.suspectReasoning.map(r=>({suspectId:r.suspectId,reasoning:r.reasoning}))};
  if(useMongo){await CaseAttempt.create({caseId:c.id,selectedSuspectId:suspectId,verdict:result.verdict,result});}else memoryAttempts.set(c.id,{result});
  return res.json({result});
}));
const clientDist=resolve(dirname(fileURLToPath(import.meta.url)),'../../client/dist');
if(existsSync(clientDist)){app.use(express.static(clientDist));app.get('*',(_req,res)=>res.sendFile(resolve(clientDist,'index.html')));}
app.use((_req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'The requested route was not found.',requestId:res.getHeader('x-request-id')}}));
app.use((err:any,req:Request,res:Response,_next:NextFunction)=>{
  const status=err.status ?? 500, code=err.code ?? (status===429?'RATE_LIMITED':'INTERNAL_ERROR');
  if(status>=500)console.error(JSON.stringify({timestamp:new Date().toISOString(),level:'error',requestId:res.getHeader('x-request-id'),route:`${req.method} ${req.path}`,category:code,...(err.diagnostic??{})}));
  res.status(status).json({error:{code,message:status>=500&&code==='INTERNAL_ERROR'?'Something went wrong. Please try again.':err.message,requestId:res.getHeader('x-request-id')}});
});
