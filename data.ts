import { fetch } from 'scripting'
export type Server = {
 id:string; name:string; hostname:string; suspended:boolean; migrating?:boolean; deleting?:boolean; rescue?:boolean;
 cpu:string; memory:string; storage:{capacity:string;enabled:boolean;primary:boolean}[];
 network:{primary:{limit:string;ipv4:{address:string}[]}};
 currentMonthlyPeriod:{start:string;end:string}; state?: {status?:string;running?:boolean;cpu?:string;network?:{primary?:{traffic?:{rx:number;tx:number;total:number}}}} | null;
}
export type Snapshot = {servers:Server[];updated:number}
export const cached=()=>Storage.get<Snapshot>('snapshot')
export const selected=()=>Storage.get<string>('selected') || ''
export function message(e:unknown){return e instanceof Error ? e.message : '网络暂时不可用'}
async function request(path:string,token:string){
 const response=await Promise.race([fetch('https://cloud.sa.net/api'+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'}}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('请求超时')),12000))])
 if(response.status===401)throw new Error('密钥无效或已过期')
 if(response.status===429)throw new Error('请求过于频繁，请稍后刷新')
 if(!response.ok)throw new Error('服务暂时不可用 · HTTP '+response.status)
 return await response.json() as any
}
export async function refresh(parameter=''):Promise<Snapshot>{
 const token=Keychain.get('apiToken')
 if(!token)throw new Error('请运行脚本配置 API 密钥')
 const servers:Server[]=[]
 for(let page=1;page<=20;page++){
  const result=await request('/server?page='+page,token)
  if(!Array.isArray(result.data))throw new Error('服务器列表格式异常')
  servers.push(...result.data)
  if(!result.next_page_url)break
  if(page===20)throw new Error('服务器数量超出组件处理范围')
 }
 const id=servers.find(s=>s.id===parameter || s.name===parameter)?.id || selected() || servers[0]?.id
 if(id && servers.some(s=>s.id===id)){
  const detail=await request('/server/'+encodeURIComponent(id)+'?state=true',token)
  const index=servers.findIndex(s=>s.id===id)
  if(detail.data)servers[index]={...servers[index],...detail.data}
 }
 const result={servers,updated:Date.now()}
 Storage.set('snapshot',result)
 return result
}
export function choose(snapshot:Snapshot|null,parameter=''){
 const p=parameter.trim() || selected()
 return snapshot?.servers.find(s=>s.id===p || s.name===p) || (p?undefined:snapshot?.servers[0])
}
export function cycle(s:Server){
 const start=new Date(s.currentMonthlyPeriod.start).getTime(),end=new Date(s.currentMonthlyPeriod.end).getTime()
 return {fraction:Math.max(0,Math.min(1,(Date.now()-start)/(end-start))),days:Math.max(0,Math.ceil((end-Date.now())/86400000)),end:new Date(end).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'})}
}
export function status(s:Server){
 if(s.suspended)return {label:'已暂停',color:'#FF9F70' as const}
 if(s.deleting)return {label:'删除中',color:'#FF9F70' as const}
 if(s.migrating)return {label:'迁移中',color:'#F3D789' as const}
 if(s.rescue)return {label:'救援模式',color:'#F3D789' as const}
 if(s.state?.running===true)return {label:'运行中',color:'#69E4C2' as const}
 if(s.state?.running===false)return {label:'已关机',color:'#FF9F70' as const}
 // No power status is inferred when remote state is unavailable.
 return {label:'账户正常',color:'#69E4C2' as const}
}
export function traffic(s:Server){
 const t=s.state?.network?.primary?.traffic
 return t && [t.rx,t.tx,t.total].every(n=>typeof n==='number' && Number.isFinite(n) && n>=0)?t:null
}
export function count(n:number){return n.toLocaleString('en-US',{maximumFractionDigits:0})}
export function compactCount(n:number){return n>=1e9?(n/1e9).toFixed(2)+' ×10⁹':count(n)}
export function trafficPrefs(){return {base:Storage.get<number>('trafficBase')===1000?1000:1024,unit:Storage.get<string>('trafficUnit')==='bits'?'bits':'bytes'}}
export function formatTraffic(bytes:number,base=trafficPrefs().base){
 const units=base===1024?['B','KiB','MiB','GiB','TiB','PiB']:['B','kB','MB','GB','TB','PB']
 let value=Math.max(0,bytes),i=0
 while(value>=base && i<units.length-1){value/=base;i++}
 return value.toFixed(i===0?0:value>=100?1:2)+' '+units[i]
}
export function trafficSummary(s:Server){
 const t=traffic(s),p=trafficPrefs(),m=s.network.primary.limit.trim().match(/^([\d.]+)\s*([KMGTPE]?)(?:I?B)$/i)
 const amount=m?Number(m[1]):NaN,index=m?'KMGTPE'.indexOf(m[2].toUpperCase())+1:0
 const limit=m?amount*Math.pow(p.base,index):NaN
 const divisor=p.unit==='bits'?8:1
 const used=t?t.total/divisor:null
 const valid=Number.isFinite(limit)&&limit>0
 const percent=used!==null&&valid?used/limit*100:null
 return {rx:t?t.rx/divisor:null,tx:t?t.tx/divisor:null,used,limit:valid?limit:null,percent,remaining:used!==null&&valid?Math.max(0,limit-used):null,over:used!==null&&valid?Math.max(0,used-limit):0}
}
export function memory(s:Server){return s.memory==='8192 MB'?'8 GB':s.memory}
export function quota(s:Server){const q=s.network.primary.limit;const n=parseFloat(q);return q.endsWith(' GB') && n>=1024 ? (n/1024).toFixed(n%1024?1:0)+' TB':q}
