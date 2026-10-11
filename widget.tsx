import {VStack,HStack,ZStack,Text,Spacer,Circle,Widget,Divider,SVG} from 'scripting'
import {Server,Snapshot,cached,refresh,message,choose,cycle,status,memory,trafficSummary,formatTraffic} from './data'
import {logo} from './brand'
const purple='#4B006E',ink='#17131C',muted='#6D6D6D',line='#EDE7F1'
function Ring({server,size=72}:{server:Server;size?:number}){
 const p=trafficSummary(server).percent,color=p!==null&&p>=100?'#CB493C':p!==null&&p>=80?'#B87927':purple
 return <ZStack frame={{width:size,height:size}}><Circle stroke={{shapeStyle:line,strokeStyle:{lineWidth:6}}}/>{p!==null&&p>0?<Circle trim={{from:0,to:Math.min(1,p/100)}} stroke={{shapeStyle:color,strokeStyle:{lineWidth:6,lineCap:'round'}}} rotationEffect={-90}/>:null}<VStack frame={{width:size-14}} spacing={2}><Text font={size>80?22:14} fontWeight="semibold" monospacedDigit foregroundStyle={color} minScaleFactor={0.5} lineLimit={1}>{p===null?'—':p.toFixed(1)+'%'}</Text><Text font={size<50?7:8} foregroundStyle={muted} lineLimit={1}>{size<50?'占比':'额度占比'}</Text></VStack></ZStack>
}
function Metric({label,value}:{label:string;value:string}){return <VStack alignment="leading" spacing={4} frame={{maxWidth:'infinity'}}><Text font={9} foregroundStyle={muted}>{label}</Text><Text font={14} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.7}>{value}</Text></VStack>}
function ResourceRing({label,capacity,percent,size=32,compact=false}:{label:string;capacity:string;percent:number|null;size?:number;compact?:boolean}){
 const color=percent!==null&&percent>=90?'#CB493C':percent!==null&&percent>=75?'#B87927':purple
 const ring=<ZStack frame={{width:size,height:size}}><Circle stroke={{shapeStyle:line,strokeStyle:{lineWidth:3}}}/>{percent!==null&&percent>0?<Circle trim={{from:0,to:Math.min(1,percent/100)}} stroke={{shapeStyle:color,strokeStyle:{lineWidth:3,lineCap:'round'}}} rotationEffect={-90}/>:null}<Text font={size>40?12:8} fontWeight="semibold" monospacedDigit foregroundStyle={percent===null?muted:color} lineLimit={1} minScaleFactor={0.5} frame={{width:size-6}}>{percent===null?'—':percent.toFixed(1)+'%'}</Text></ZStack>
 const info=<VStack alignment={compact?'leading':'center'} spacing={2}><Text font={8} fontWeight="medium">{label}</Text><Text font={8} foregroundStyle={muted} lineLimit={1} minScaleFactor={0.6}>{capacity}</Text>{!compact?<Text font={7} foregroundStyle={muted}>{percent===null?'占用未提供':'当前负载'}</Text>:null}</VStack>
 return compact?<HStack spacing={5} frame={{maxWidth:'infinity'}}>{ring}{info}</HStack>:<VStack spacing={5} frame={{maxWidth:'infinity'}}>{ring}{info}</VStack>
}
function cpuPercent(s:Server){const m=s.state?.cpu?.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);const p=m?Number(m[1]):NaN;return Number.isFinite(p)&&p>=0?p:null}
function Content({snapshot,error='',family='systemMedium',parameter=''}:{snapshot:Snapshot|null;error?:string;family?:string;parameter?:string}){
 const s=choose(snapshot,parameter),small=family==='systemSmall',large=family==='systemLarge',time=snapshot?new Date(snapshot.updated).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}):''
 if(!s)return <VStack alignment="leading" spacing={12} padding={16}><SVG code={logo} resizable frame={{width:30,height:25}}/><Text font={17} fontWeight="semibold">Riven Cloud</Text><Text font={11} foregroundStyle={muted}>{error || '请运行脚本连接账户'}</Text></VStack>
 const st=status(s),c=cycle(s),u=trafficSummary(s),fmt=(n:number|null)=>n===null?'—':formatTraffic(n),p=u.percent
 const used=fmt(u.used),remain=fmt(u.remaining),limit=fmt(u.limit)
 if(!small&&!large)return <VStack alignment="leading" spacing={5} foregroundStyle={ink} padding={14}>
  <HStack spacing={6}><SVG code={logo} resizable frame={{width:21,height:18}}/><Text font={13} fontWeight="semibold" lineLimit={1} minScaleFactor={0.7}>{s.name}</Text><Spacer/><Circle fill={error?'#B87927':st.color} frame={{width:5,height:5}}/><Text font={9} foregroundStyle={muted}>{error?'缓存':st.label}</Text></HStack>
  <HStack spacing={12}>
   <VStack alignment="leading" spacing={2} frame={{maxWidth:'infinity'}}><Text font={22} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.65}>{used}</Text><Text font={9} foregroundStyle={muted}>流量估算 / {limit} · 剩余 {remain}</Text></VStack>
   <Ring server={s} size={43}/>
  </HStack>
  <HStack spacing={5}><ResourceRing label="CPU" capacity={s.cpu.replace(' Core',' 核')} percent={cpuPercent(s)} compact/><ResourceRing label="内存" capacity={memory(s)} percent={null} compact/><ResourceRing label="磁盘" capacity={s.storage.find(d=>d.primary)?.capacity || '—'} percent={null} compact/></HStack>
  <Spacer minLength={0}/>
  <HStack spacing={4}><Text font={9} foregroundStyle={muted}>账期 {c.end}</Text><Text font={9} fontWeight="medium" foregroundStyle={purple}>剩余 {c.days} 天</Text><Spacer/><Text font={8} foregroundStyle={muted}>{error?'缓存 '+time:'更新 '+time}</Text></HStack>
 </VStack>
 return <VStack alignment="leading" spacing={large?6:small?5:4} foregroundStyle={ink} padding={16}>
  <HStack spacing={7}><SVG code={logo} resizable frame={{width:small?19:23,height:small?16:large?20:16}}/><Text font={small?11:13} fontWeight="semibold">{small?'Riven':'Riven Cloud'}</Text><Spacer/><Circle fill={error?'#B87927':st.label==='运行中'?'#278751':'#827889'} frame={{width:5,height:5}}/>{!small?<Text font={9} foregroundStyle={muted}>{error?'缓存':st.label}</Text>:null}</HStack>
  <Text font={small?13:large?21:15} fontWeight="semibold" lineLimit={1} minScaleFactor={0.65}>{s.name}</Text>
  {small?<VStack alignment="leading" spacing={4}><Text font={26} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.6}>{used}</Text><HStack><Text font={11} foregroundStyle={purple} fontWeight="semibold">{p===null?'—':p.toFixed(1)+'%'}</Text><Text font={8} foregroundStyle={muted}>/ {limit}</Text></HStack><Text font={9} foregroundStyle={muted}>剩余 {remain}</Text></VStack>:<HStack spacing={16}><VStack alignment="leading" spacing={4} frame={{maxWidth:'infinity'}}><Text font={10} foregroundStyle={muted}>流量 · 估算</Text><Text font={large?34:24} fontWeight="semibold" foregroundStyle={purple} monospacedDigit lineLimit={1} minScaleFactor={0.6}>{used}</Text><Text font={10} foregroundStyle={muted}>/ {limit}</Text></VStack><Ring server={s} size={large?74:58}/></HStack>}
  {large?<VStack alignment="leading" spacing={8}>
   <HStack><Text font={11} foregroundStyle={muted}>{u.over>0?'超额':'剩余'}</Text><Spacer/><Text font={16} fontWeight="semibold" foregroundStyle={u.over>0?'#CB493C':purple}>{u.over>0?formatTraffic(u.over):remain}</Text></HStack>
   <HStack><Metric label="↓ 接收" value={fmt(u.rx)}/><Metric label="↑ 发送" value={fmt(u.tx)}/></HStack>
   <Divider foregroundStyle={line}/>
   <HStack spacing={8}><ResourceRing label="CPU" capacity={s.cpu.replace(' Core',' 核')} percent={cpuPercent(s)} size={43}/><ResourceRing label="内存" capacity={memory(s)} percent={null} size={43}/><ResourceRing label="磁盘" capacity={s.storage.find(d=>d.primary)?.capacity || '—'} percent={null} size={43}/></HStack>

   <HStack><Text font={10} foregroundStyle={muted}>账期结束</Text><Spacer/><Text font={11} monospacedDigit>{c.end} · {c.days} 天</Text></HStack>
  </VStack>:!small?<HStack><Text font={10} foregroundStyle={muted}>剩余 {remain}</Text><Spacer/><Text font={9} foregroundStyle={muted}>CPU {s.state?.cpu || '—'}</Text></HStack>:null}
  <Spacer minLength={0}/>
  <HStack><Text font={8} foregroundStyle={muted}>{small?'流量估算':large?s.network.primary.ipv4[0]?.address || s.hostname:`账期 ${c.end}`}</Text><Spacer/><Text font={8} foregroundStyle={muted}>{error?'缓存 '+time:'更新 '+time}</Text></HStack>
 </VStack>
}
export function CloudWidget(props:{snapshot:Snapshot|null;error?:string;family?:string;parameter?:string}){return <VStack spacing={0} frame={{maxWidth:'infinity',maxHeight:'infinity'}} widgetBackground="#FFFFFF"><Content {...props}/></VStack>}
async function main(){let snapshot=cached(),error='';const s=choose(snapshot,Widget.parameter);if(!snapshot || !s?.state || Date.now()-snapshot.updated>5*60000){try{snapshot=await refresh(Widget.parameter)}catch(e){error=message(e)}}Widget.present(<CloudWidget snapshot={snapshot} error={error} family={Widget.family} parameter={Widget.parameter}/>,{policy:'after',date:new Date(Date.now()+30*60000)})}
main()
