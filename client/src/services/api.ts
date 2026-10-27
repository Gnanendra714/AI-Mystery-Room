import type {CaseFile,Result} from '../types';
const base=import.meta.env.VITE_API_BASE_URL||(import.meta.env.DEV?'http://localhost:4000/api/v1':'/api/v1');
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const res=await fetch(`${base}${path}`,{...init,headers:{'Content-Type':'application/json',...init?.headers}});
  const payload=await res.json();if(!res.ok)throw new Error(payload?.error?.message||'Something went wrong. Please try again.');return payload as T;
}
export const api={create:(data:{storySeed:string;difficulty:string;theme:string})=>request<{case:CaseFile}>('/cases',{method:'POST',body:JSON.stringify(data)}),getCase:(id:string)=>request<{case:CaseFile}>(`/cases/${encodeURIComponent(id)}`),accuse:(id:string,suspectId:string)=>request<{result:Result}>(`/cases/${encodeURIComponent(id)}/accusation`,{method:'POST',body:JSON.stringify({suspectId})})};
