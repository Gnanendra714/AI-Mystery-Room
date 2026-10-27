import {beforeAll,beforeEach,describe,it,expect,vi} from 'vitest';
import request from 'supertest';
vi.mock('./services/ai/gemini.js',async importOriginal=>{
  const actual=await importOriginal<typeof import('./services/ai/gemini.js')>();
  return {...actual,generateWithGemini:vi.fn(async(seed:string,difficulty:'easy'|'medium'|'hard',theme:'classic_detective'|'locked_room'|'workplace_mystery'|'historical_fiction'|'sci_fi'|'campus_mystery'|'custom')=>{
    const {createFixture}=await import('./services/case/fixture.js');return createFixture(difficulty,theme,seed);
  })};
});
let app:typeof import('./app.js').app;

describe('case API',()=>{
  let caseId='';
  beforeAll(async()=>{vi.stubEnv('NODE_ENV','test');({app}=await import('./app.js'));});
  beforeEach(async()=>{
    const response=await request(app).post('/api/v1/cases').send({storySeed:'A fictional museum curator discovers a rare clock has vanished during a private evening event.',difficulty:'easy',theme:'classic_detective'});
    expect(response.status).toBe(201); caseId=response.body.case.id;
  });
  it('returns only public case fields before accusation',async()=>{
    const response=await request(app).get(`/api/v1/cases/${caseId}`);
    expect(response.status).toBe(200);
    expect(response.body.case.culpritSuspectId).toBeUndefined();
    expect(response.body.case.solutionExplanation).toBeUndefined();
    expect(response.body.case.evidence[0].classification).toBeUndefined();
  });
  it('evaluates accusations deterministically and returns the previous result',async()=>{
    const suspectId=(await request(app).get(`/api/v1/cases/${caseId}`)).body.case.suspects[0].id;
    const first=await request(app).post(`/api/v1/cases/${caseId}/accusation`).send({suspectId});
    const second=await request(app).post(`/api/v1/cases/${caseId}/accusation`).send({suspectId:'s-jonah'});
    expect(first.status).toBe(200);expect(first.body.result.verdict).toBe('correct');expect(second.body.result).toEqual(first.body.result);
  });
  it('rejects invalid story seeds before generation',async()=>{
    const response=await request(app).post('/api/v1/cases').send({storySeed:'short'});
    expect(response.status).toBe(400);expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
