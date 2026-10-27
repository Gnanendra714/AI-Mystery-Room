import mongoose, { Schema } from 'mongoose';
const attemptSchema = new Schema({ caseId:{type:String,required:true,index:true},selectedSuspectId:{type:String,required:true},verdict:{type:String,enum:['correct','incorrect'],required:true},result:{type:Schema.Types.Mixed,required:true},submittedAt:{type:Date,default:Date.now} });
export const CaseAttempt: mongoose.Model<any> = mongoose.models.CaseAttempt as mongoose.Model<any> ?? mongoose.model<any>('CaseAttempt',attemptSchema);
