import {VStack,HStack,ZStack,Text,Spacer,Circle,Widget,Divider,SVG} from 'scripting'
import {Server,Snapshot,cached,refresh,message,choose,cycle,status,memory,trafficSummary,formatTraffic} from './data'
import {logo} from './brand'
const purple='#4B006E',ink='#17131C',muted='#6D6D6D',line='#EDE7F1'
function Ring({server,size=72}:{server:Server;size?:number}){
 const p=trafficSummary(server).percent,color=p!==null&&p>=100?'#CB493C':p!==null&&p>=80?'#B87927':purple
 return <ZStack frame={{width:size,height:size}}><Circle stroke={{shapeStyle:line,strokeStyle:{lineWidth:size>70?6:5}}}/>{p!==null&&p>0?<Circle trim={{from:0,to:Math.min(1,p/100)}} stroke={{shapeStyle:color,strokeStyle:{lineWidth:size>70?6:5,lineCap:'round'}}} rotationEffect={-90}/>:null}<Text frame={{width:size-16}} font={size>70?19:13} fontWeight="semibold" monospacedDigit foregroundStyle={color} minScaleFactor={0.5} lineLimit={1}>{p===null?'—':p.toFixed(1)+'%'}</Text></ZStack>
}
function Metric({label,value}:{label:string;value:string}){return <VStack alignment="leading" spacing={4} frame={{maxWidth:'infinity'}}><Text font={9} foregroundStyle={muted}>{label}</Text><Text font={14} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.7}>{value}</Text></VStack>}
function RegionBadge({server}:{server:Server}){
 // Region hint from the server name, not IP geolocation. Unknown names stay unlabelled.
 if(!/(?:^|[-_\s])jp(?:$|[-_\s])/i.test(server.name))return null
 return <HStack spacing={3}><SVG code={'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16"><rect x=".5" y=".5" width="23" height="15" rx="2.5" fill="#FFFFFF" stroke="#E5DFE9"/><circle cx="12" cy="8" r="4" fill="#BC002D"/></svg>'} resizable frame={{width:15,height:10}}/><Text font={8} fontWeight="semibold" foregroundStyle={muted}>JP</Text></HStack>
}
function Content({snapshot,error='',family='systemMedium',parameter=''}:{snapshot:Snapshot|null;error?:string;family?:string;parameter?:string}){
 const s=choose(snapshot,parameter),small=family==='systemSmall',large=family==='systemLarge',time=snapshot?new Date(snapshot.updated).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}):''
 if(!s)return <VStack alignment="leading" spacing={12} padding={16}><SVG code={logo} resizable frame={{width:30,height:25}}/><Text font={17} fontWeight="semibold">Riven Cloud</Text><Text font={11} foregroundStyle={muted}>{error || '请运行脚本连接账户'}</Text></VStack>
 const st=status(s),c=cycle(s),u=trafficSummary(s),fmt=(n:number|null)=>n===null?'—':formatTraffic(n),p=u.percent
 const used=fmt(u.used),remain=fmt(u.remaining),limit=fmt(u.limit)
 if(!small&&!large)return <VStack alignment="leading" spacing={7} foregroundStyle={ink} padding={16}>
  <HStack spacing={6}><SVG code={logo} resizable frame={{width:21,height:18}}/><Text font={13} fontWeight="semibold" lineLimit={1} minScaleFactor={0.7}>{s.name}</Text><RegionBadge server={s}/><Spacer/><Circle fill={error?'#B87927':st.color} frame={{width:5,height:5}}/><Text font={9} foregroundStyle={muted}>{error?'缓存':st.label}</Text></HStack>
  <HStack spacing={12}>
   <VStack alignment="leading" spacing={2} frame={{maxWidth:'infinity'}}><Text font={27} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.65}>{used}</Text><Text font={9} foregroundStyle={muted}>流量估算 / {limit} · 剩余 {remain}</Text></VStack>
   <Ring server={s} size={54}/>
  </HStack>
  <HStack spacing={6}><Text font={9} foregroundStyle={muted} lineLimit={1} minScaleFactor={0.7}>{s.cpu.replace(' Core',' 核')} · {memory(s)} · {s.storage.find(d=>d.primary)?.capacity || '—'}</Text><Spacer/><Text font={9} foregroundStyle={muted}>CPU {s.state?.cpu || '—'}</Text></HStack>
  <Spacer minLength={0}/>
  <HStack spacing={4}><Text font={9} foregroundStyle={muted}>账期 {c.end}</Text><Text font={9} fontWeight="medium" foregroundStyle={purple}>剩余 {c.days} 天</Text><Spacer/><Text font={8} foregroundStyle={muted}>{error?'缓存 '+time:'更新 '+time}</Text></HStack>
 </VStack>
 return <VStack alignment="leading" spacing={large?10:small?5:4} foregroundStyle={ink} padding={16}>
  <HStack spacing={7}><SVG code={logo} resizable frame={{width:small?19:23,height:small?16:large?20:16}}/><Text font={small?11:13} fontWeight="semibold">{small?'Riven':'Riven Cloud'}</Text><Spacer/><Circle fill={error?'#B87927':st.label==='运行中'?'#278751':'#827889'} frame={{width:5,height:5}}/>{!small?<Text font={9} foregroundStyle={muted}>{error?'缓存':st.label}</Text>:null}</HStack>
  <HStack spacing={7}><Text font={small?13:large?21:15} fontWeight="semibold" lineLimit={1} minScaleFactor={0.65}>{s.name}</Text><RegionBadge server={s}/><Spacer minLength={0}/></HStack>
  {small?<VStack alignment="leading" spacing={4}><Text font={26} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.6}>{used}</Text><HStack><Text font={11} foregroundStyle={purple} fontWeight="semibold">{p===null?'—':p.toFixed(1)+'%'}</Text><Text font={8} foregroundStyle={muted}>/ {limit}</Text></HStack><Text font={9} foregroundStyle={muted}>剩余 {remain}</Text></VStack>:<HStack spacing={16}><VStack alignment="leading" spacing={4} frame={{maxWidth:'infinity'}}><Text font={10} foregroundStyle={muted}>流量 · 估算</Text><Text font={large?34:24} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.6}>{used}</Text><Text font={10} foregroundStyle={muted}>/ {limit}</Text></VStack><Ring server={s} size={large?82:58}/></HStack>}
  {large?<VStack alignment="leading" spacing={8}>
   <HStack><Text font={11} foregroundStyle={muted}>{u.over>0?'超额':'剩余'}</Text><Spacer/><Text font={16} fontWeight="semibold" foregroundStyle={u.over>0?'#CB493C':purple}>{u.over>0?formatTraffic(u.over):remain}</Text></HStack>
   <HStack><Metric label="↓ 接收" value={fmt(u.rx)}/><Metric label="↑ 发送" value={fmt(u.tx)}/></HStack>
   <Divider foregroundStyle={line}/>
   <HStack spacing={12}><Metric label="CPU" value={s.cpu.replace(' Core',' 核')}/><Metric label="内存" value={memory(s)}/><Metric label="磁盘" value={s.storage.find(d=>d.primary)?.capacity || '—'}/></HStack>
    <HStack><Text font={10} foregroundStyle={muted}>CPU 负载</Text><Spacer/><Text font={11} monospacedDigit>{s.state?.cpu || '—'}</Text></HStack>

   <HStack><Text font={10} foregroundStyle={muted}>账期结束</Text><Spacer/><Text font={11} monospacedDigit>{c.end} · {c.days} 天</Text></HStack>
  </VStack>:!small?<HStack><Text font={10} foregroundStyle={muted}>剩余 {remain}</Text><Spacer/><Text font={9} foregroundStyle={muted}>CPU {s.state?.cpu || '—'}</Text></HStack>:null}
  <Spacer minLength={0}/>
  <HStack><Text font={8} foregroundStyle={muted}>{small?'流量估算':large?s.network.primary.ipv4[0]?.address || s.hostname:`账期 ${c.end}`}</Text><Spacer/><Text font={8} foregroundStyle={muted}>{error?'缓存 '+time:'更新 '+time}</Text></HStack>
 </VStack>
}
export function CloudWidget(props:{snapshot:Snapshot|null;error?:string;family?:string;parameter?:string}){return <VStack spacing={0} frame={{maxWidth:'infinity',maxHeight:'infinity'}} widgetBackground="#FFFFFF"><Content {...props}/></VStack>}
async function main(){let snapshot=cached(),error='';const s=choose(snapshot,Widget.parameter);if(!snapshot || !s?.state || Date.now()-snapshot.updated>5*60000){try{snapshot=await refresh(Widget.parameter)}catch(e){error=message(e)}}Widget.present(<CloudWidget snapshot={snapshot} error={error} family={Widget.family} parameter={Widget.parameter}/>,{policy:'after',date:new Date(Date.now()+30*60000)})}
main()
