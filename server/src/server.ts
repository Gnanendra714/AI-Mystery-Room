import { app } from './app.js';
import { env } from './config/env.js';
import mongoose from 'mongoose';
if(env.nodeEnv==='production'&&!env.geminiApiKey){console.error('GEMINI_API_KEY is required in production. Set it in the hosting provider environment settings.');process.exit(1);}
if(env.mongoUri){
  try{ await mongoose.connect(env.mongoUri,{serverSelectionTimeoutMS:8000}); console.log('Connected to MongoDB.'); }
  catch(error){
    const details:Array<Record<string,unknown>>=[];let current:any=error;
    for(let depth=0;current&&depth<4;depth++,current=current.cause){
      details.push({name:typeof current.name==='string'?current.name:undefined,code:typeof current.code==='string'||typeof current.code==='number'?current.code:undefined,codeName:typeof current.codeName==='string'?current.codeName:undefined,syscall:typeof current.syscall==='string'?current.syscall:undefined,address:typeof current.address==='string'?current.address:undefined,port:typeof current.port==='number'?current.port:undefined});
    }
    const failure=error as {name?:string;message?:string;code?:number|string;codeName?:string};
    const safeMessage=(failure.message??'').toLowerCase();
    const authFailure=details.some(x=>x.code===18||x.codeName==='AuthenticationFailed')||safeMessage.includes('authentication failed')||safeMessage.includes('bad auth');
    const srvLookupRefused=details.some(x=>x.syscall==='querySrv'&&x.code==='ECONNREFUSED');
    const category=authFailure?'MONGODB_AUTH_FAILED':failure.name==='MongoParseError'?'MONGODB_URI_INVALID':srvLookupRefused?'MONGODB_DNS_SRV_FAILED':details.some(x=>x.code==='ECONNREFUSED'||x.code==='ETIMEDOUT'||x.code==='ENOTFOUND')?'MONGODB_UNREACHABLE':'MONGODB_CONNECTION_FAILED';
    console.error(JSON.stringify({timestamp:new Date().toISOString(),level:'error',category,errors:details}));
    console.error(authFailure
      ? 'MongoDB rejected authentication. Check the database username, password, and authentication database in server/.env.'
      : category==='MONGODB_URI_INVALID'
        ? 'The MongoDB connection string is invalid. Check its format in server/.env.'
        : srvLookupRefused
          ? 'The DNS resolver refused the MongoDB SRV lookup. Allow SRV/TXT DNS queries on this network, or use the standard mongodb:// seed-list URI from Atlas.'
          : 'MongoDB could not be reached. Check that the database is running and that your network or Atlas IP access list permits this connection.');
    process.exit(1);
  }
}else if(env.nodeEnv==='production'){console.error('MONGODB_URI is required in production.');process.exit(1);}
else console.log('MONGODB_URI is unset; using the local fixture and in-memory storage.');
app.listen(env.port,()=>console.log(`AI Mystery Room API listening on port ${env.port}`));
