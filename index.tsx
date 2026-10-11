import { Navigation, NavigationStack, List, Section, Button, Text, SecureField, useState, Script, Widget, HStack, Spacer } from 'scripting'
import {cached, refresh, message, selected, Snapshot} from './data'
function Settings(){
 const dismiss=Navigation.useDismiss()
 const [token,setToken]=useState('')
 const [snapshot,setSnapshot]=useState<Snapshot|null>(cached())
 const [notice,setNotice]=useState(Keychain.contains('apiToken')?'密钥已安全保存':'请输入 API 密钥')
 const [busy,setBusy]=useState(false)
 const [id,setId]=useState(selected())
 async function load(save=false){
  if(busy)return
  setBusy(true)
  try{
   if(save){if(!token.trim())throw new Error('请输入密钥');if(!Keychain.set('apiToken',token.trim()))throw new Error('Keychain 保存失败');setToken('');Storage.remove('snapshot');setSnapshot(null)}
   const data=await refresh();setSnapshot(data);setNotice('数据已更新 · '+new Date(data.updated).toLocaleTimeString('zh-CN')+' · 已请求桌面重载');Widget.reloadAll()
  }catch(e){setNotice(message(e))}finally{setBusy(false)}
 }
 return <NavigationStack><List navigationTitle="Riven Cloud" navigationBarTitleDisplayMode="inline" toolbar={{cancellationAction:<Button title="完成" action={dismiss}/>}}>
  <Section header={<Text>连接与安全</Text>} footer={<Text>密钥仅保存在本脚本的系统 Keychain 中，不写入项目源码。组件只发送 GET 请求。</Text>}>
   <SecureField title="新的 API 密钥" value={token} onChanged={setToken}/>
   <Button title="保存密钥并连接" action={()=>load(true)} disabled={busy}/>
   <Button title={busy?'正在读取…':'刷新服务器数据'} action={()=>load()} disabled={busy}/>
   <Button title="重载桌面小组件" action={()=>{Widget.reloadAll();setNotice('已请求桌面重载，请返回主屏查看')}}/>
   <Text font="caption" foregroundStyle="secondaryLabel">{notice}</Text>
  </Section>
  <Section header={<Text>显示的服务器</Text>} footer={<Text>多个组件可在组件参数中填写服务器名称或 UUID，分别显示不同服务器。</Text>}>
   {(snapshot?.servers || []).map(s=><Button key={s.id} action={()=>{Storage.set('selected',s.id);setId(s.id);Widget.reloadAll()}}><HStack><Text>{s.name}</Text><Spacer/><Text foregroundStyle="secondaryLabel">{s.id===(id || snapshot?.servers[0]?.id)?'已选择':'选择'}</Text></HStack></Button>)}
   {snapshot?.servers.length===0?<Text>此账户没有服务器</Text>:null}
  </Section>
  <Section header={<Text>小组件预览</Text>}>
   <Button title="小号 · 紧凑卡片" action={()=>Widget.preview({family:'systemSmall'})}/>
   <Button title="中号 · 服务器仪表盘" action={()=>Widget.preview({family:'systemMedium'})}/>
   <Button title="大号 · 完整信息" action={()=>Widget.preview({family:'systemLarge'})}/>
  </Section>
  <Section header={<Text>流量换算口径</Text>} footer={<Text>默认假设计数为字节、额度按 1024 进制。占比 = 远端总量 ÷ 套餐额度。统计周期尚未确认，不代表已核实的本月使用率。</Text>}>
   <Button title="1024 进制 · KiB / MiB / GiB / TiB（默认）" action={()=>{Storage.set('trafficBase',1024);setNotice('已切换 1024 进制');Widget.reloadAll()}}/>
   <Button title="1000 进制 · kB / MB / GB / TB" action={()=>{Storage.set('trafficBase',1000);setNotice('已切换 1000 进制');Widget.reloadAll()}}/>
   <Button title="原始计数按字节解释（默认）" action={()=>{Storage.set('trafficUnit','bytes');setNotice('原始计数按字节解释');Widget.reloadAll()}}/>
   <Button title="原始计数按 bit 解释（确认后使用）" action={()=>{Storage.set('trafficUnit','bits');setNotice('原始计数按 bit 解释');Widget.reloadAll()}}/>
  </Section>
  <Section header={<Text>数据说明</Text>}>
   <Text font="footnote">详情请求启用 state=true。流量自动换算单位，圆环表示远端总量与套餐额度的比值，超过 100% 时保留真实百分比并显示超额。文档未确认原始单位及重置周期，默认按字节估算；剩余额度也是基于此口径的估算，不是服务商确认的月度余额。</Text>
   <Text font="footnote">自动请求约每 30 分钟一次；实际刷新时间由 iOS 决定。请求失败会保留上次数据并标注缓存。</Text>
   <Button title="移除密钥与缓存" role="destructive" action={()=>{Keychain.remove('apiToken');Storage.remove('snapshot');setSnapshot(null);setNotice('密钥与缓存已移除');Widget.reloadAll()}}/>
  </Section>
 </List></NavigationStack>
}
async function main(){await Navigation.present(<Settings/>);Script.exit()}
main()
