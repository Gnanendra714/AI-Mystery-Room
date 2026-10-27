import {describe,it,expect} from 'vitest';
import {createCaseSchema,validateFairCase} from './case.js';
import {createFixture} from '../services/case/fixture.js';

describe('case contracts',()=>{
  it('trims and validates story seed bounds',()=>{
    expect(createCaseSchema.safeParse({storySeed:'   a fictional museum mystery with enough detail   '} ).success).toBe(true);
    expect(createCaseSchema.safeParse({storySeed:'too short'}).success).toBe(false);
    expect(createCaseSchema.safeParse({storySeed:'x'.repeat(1501)}).success).toBe(false);
    expect(createCaseSchema.safeParse({storySeed:'a'.repeat(20),difficulty:'impossible'}).success).toBe(false);
  });
  it.each(['easy','medium','hard'] as const)('accepts fair %s fixture',difficulty=>{
    const fixture=createFixture(difficulty,'classic_detective','A fictional premise with adequate length.');
    expect(()=>validateFairCase(fixture,difficulty,'classic_detective')).not.toThrow();
  });
  it('rejects unknown private clue references',()=>{
    const fixture=createFixture('easy','classic_detective','A fictional premise with adequate length.');
    expect(()=>validateFairCase({...fixture,decisiveEvidenceIds:['missing','e-message']})).toThrow();
  });
});
