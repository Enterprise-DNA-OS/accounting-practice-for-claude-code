#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table,isoDate} from './lib/format.mjs';
import {importFile} from './lib/import.mjs';

export const reads={
 clients:'select c.id,c.name,c.client_group,c.jurisdiction,s.name as owner,c.engagement_signed from clients c left join staff s on s.id=c.owner_id where not c.archived order by c.name',
 jobs:'select id,name,client,owner,status,due_date,missing_records from job_summary order by due_date nulls first,name',
 deadlines:"select name,client,owner,status,due_date,missing_records from job_summary where status not in ('complete','cancelled') and (due_date is null or due_date<=current_date+60) order by due_date nulls first,name",
 attention:'select name,client,owner,reason,days from attention order by days desc,name,reason',
 'client-chase':"select r.id,c.name as client,j.name as job,r.name as missing,r.due_date,r.last_chased from requests r join jobs j on j.id=r.job_id join clients c on c.id=j.client_id where r.received_on is null and j.status not in ('complete','cancelled') order by r.due_date,r.name",
 'review-queue':"select name,client,owner,review_by,due_date,missing_records from job_summary where status='review' order by review_by nulls first,name",
 workload:'select name,weekly_hours,due_next_7_days_hours,overload_hours,awaiting_review from workload order by overload_hours desc,name',
 wip:"select c.name as client,j.name as job,j.currency,round(sum(t.hours*t.rate),2) as unbilled,round(sum(case when t.worked_on<current_date-30 then t.hours*t.rate else 0 end),2) as over_30_days from time_entries t join jobs j on j.id=t.job_id join clients c on c.id=j.client_id where t.billable and t.invoiced_ref is null group by c.name,j.name,j.currency order by unbilled desc,j.name",
 budgets:'select name,client,currency,budget_hours,hours,fee,time_value,fee_less_time_value from job_summary order by fee_less_time_value,name',
 tasks:'select t.id,j.name as job,t.name,s.name as owner,t.due_date,t.done from tasks t join jobs j on j.id=t.job_id left join staff s on s.id=t.owner_id order by t.done,t.due_date,t.name',
 timesheets:'select t.id,s.name as staff,j.name as job,t.worked_on,t.hours,t.rate,t.billable,t.invoiced_ref from time_entries t join staff s on s.id=t.staff_id join jobs j on j.id=t.job_id order by t.worked_on desc,t.id',
 triage:'select e.id,c.name as client,j.name as job,e.name as subject,e.received_on,j.due_date as job_due_date,s.name as owner from emails e join jobs j on j.id=e.job_id join clients c on c.id=j.client_id left join staff s on s.id=e.owner_id where not e.resolved order by e.received_on,e.id',
 recurring:'select r.id,r.name,c.name as client,s.name as owner,r.interval_months,r.next_due,r.budget_hours from recurring r join clients c on c.id=r.client_id left join staff s on s.id=r.owner_id order by r.next_due,r.name',
 groups:"select coalesce(client_group,client) as client_group,currency,count(*) as jobs,sum(unbilled) as unbilled,sum(missing_records) as missing_records,count(*) filter(where due_date<current_date and status not in ('complete','cancelled')) as overdue from job_summary group by coalesce(client_group,client),currency order by client_group,currency",
 activity:'select j.name as job,n.kind,n.name as detail,n.actor,n.created_at from notes n join jobs j on j.id=n.job_id order by n.created_at desc,n.id',
 audit:'select action,record_id,detail,created_at from audit order by created_at,id'
};
export const tables=['staff','clients','jobs','tasks','requests','time_entries','notes','emails','recurring','audit'];
const need=(v,label)=>{if(v===undefined||v===null||String(v).trim()==='')throw Error(`Required: ${label}`);return String(v).trim();};
const numeric=(v,label)=>{const n=Number(need(v,label));if(!Number.isFinite(n)||n<0)throw Error(`${label} must be a non-negative number`);return n;};
const day=(v,label)=>{v=need(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${label} needs a real YYYY-MM-DD date`);return v;};
export async function resolve(db,t,q){
 if(!tables.includes(t))throw Error('Unknown record type');q=need(q,`${t} name or id`);
 let found=await db.query(`select * from ${t} where id::text=$1 or lower(name)=lower($1)`,[q]);
 if(!found.length)found=await db.query(`select * from ${t} where starts_with(id::text,lower($1)) or strpos(lower(name),lower($1))>0 order by name,id`,[q]);
 if(found.length!==1){const e=Error(found.length?`Ambiguous ${t}: ${q}`:`No ${t} match: ${q}`);e.candidates=found.map(x=>({id:x.id,name:x.name}));throw e;}
 return found[0];
}
async function audit(db,action,id,detail){await db.query('insert into audit(action,record_id,detail) values($1,$2,$3)',[action,id,detail]);}
export async function compliance(db){return db.query(`
 select 'PRACTICE-ENGAGEMENT' as rule,c.name as record,'Signed engagement not recorded' as issue from clients c where not archived and engagement_signed is null
 union all select 'PRACTICE-DATE',j.name,'Deadline or source not recorded' from jobs j where status not in ('complete','cancelled') and (due_date is null or coalesce(due_source,'')='')
 union all select 'PRACTICE-REVIEW',j.name,'Review overdue' from jobs j where status='review' and review_by<current_date
 union all select 'AU-RECORD',j.name,'Completed service lacks outcome or evidence reference' from jobs j join clients c on c.id=j.client_id where c.jurisdiction='AU' and j.status='complete' and (coalesce(j.outcome,'')='' or coalesce(j.evidence_ref,'')='')
 union all select 'AU-RETENTION',j.name,'Retention before five years after completed service, or not recorded' from jobs j join clients c on c.id=j.client_id where c.jurisdiction='AU' and j.status='complete' and (j.retain_until is null or j.retain_until<(j.completed_on+interval '5 years')::date)
 union all select 'NZ-RETENTION',j.name,'NZ retention date needs practitioner confirmation' from jobs j join clients c on c.id=j.client_id where c.jurisdiction='NZ' and j.status='complete' and (j.retain_until is null or j.retain_until<(j.completed_on+interval '7 years')::date)
 union all select 'IMPORT-SCOPE',c.name,'Confirm jurisdiction after import' from clients c where c.jurisdiction='UNKNOWN'
 order by rule,record`);}
export async function run(db,args){
 const flags={};const pos=[];for(const a of args){if(a.startsWith('--')){const k=a.indexOf('=');flags[k<0?a.slice(2):a.slice(2,k)]=k<0?true:a.slice(k+1);}else pos.push(a);}
 const [cmd='help',q,...rest]=pos;
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return [{commands:[...Object.keys(reads),'client','job','compliance','weekly-review','add','set','log','time','task-done','request-received','email-resolve','assign','status','complete','roll-forward','mark-billed','draft-chase','import','export','help'].join(', ')},{syntax:'See docs/cli.md. Flags use --name=value. Every command accepts --json.'}];
 if(cmd==='compliance')return compliance(db);
 if(cmd==='weekly-review')return {attention:await db.query(reads.attention),workload:await db.query(reads.workload),wip:await db.query(reads.wip)};
 if(cmd==='client'){const c=await resolve(db,'clients',q);return {client:c,jobs:await db.query('select * from job_summary where id in (select id from jobs where client_id=$1) order by due_date',[c.id]),history:await db.query('select n.* from notes n join jobs j on j.id=n.job_id where j.client_id=$1 order by n.created_at desc',[c.id])};}
 if(cmd==='job'){const j=await resolve(db,'jobs',q);const result={job:j};for(const t of ['tasks','requests','time_entries','notes','emails'])result[t]=await db.query(`select * from ${t} where job_id=$1 order by created_at,id`,[j.id]);return result;}
 if(cmd==='export'){const out={format:'accounting-practice-v1',exported_at:new Date().toISOString()};for(const t of tables)out[t]=await db.query(`select * from ${t} order by id`);if(flags.out){const f=path.resolve(String(flags.out));fs.writeFileSync(f,JSON.stringify(out,null,2)+'\n',{flag:'wx'});return [{file:f,tables:tables.length}];}return out;}
 if(cmd==='import'){if(q!=='karbon')throw Error('Use import karbon <file.csv|file.xlsx> --kind=clients|jobs|emails [--sheet=Name] [--apply]');return importFile(db,need(rest[0],'file'),flags);}
 if(cmd==='draft-chase'){
  const j=await resolve(db,'jobs',q);const c=(await db.query('select * from clients where id=$1',[j.client_id]))[0];
  const rr=await db.query('select name,due_date from requests where job_id=$1 and received_on is null order by due_date',[j.id]);if(!rr.length)throw Error('No outstanding requests');
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${j.id}-${Date.now()}.md`);
  fs.writeFileSync(file,`DRAFT ONLY\nTo: ${c.email||'[confirm recipient]'}\nSubject: Records needed for ${j.name}\n\nHello ${c.name},\n\nPlease provide the following so we can progress ${j.name}:\n${rr.map(r=>`- ${r.name}, requested by ${isoDate(r.due_date)}`).join('\n')}\n\nThank you,\n[Your practice]\n`,{flag:'wx'});
  return [{file,status:'draft only; not sent; chase date unchanged'}];
 }
 const writes=['add','set','log','time','task-done','request-received','email-resolve','assign','status','complete','roll-forward','mark-billed'];if(!writes.includes(cmd))throw Error(`Unknown command: ${cmd}`);
 await db.exec('begin');
 try{
 let result;
 if(cmd==='add'){
  const name=need(flags.name,'--name');
  if(q==='client'){result=await db.query('insert into clients(name,email,jurisdiction,client_group) values($1,$2,$3,$4) returning id,name',[name,flags.email||null,flags.jurisdiction||'UNKNOWN',flags.group||null]);}
  else if(q==='staff'){result=await db.query('insert into staff(name,role,weekly_hours) values($1,$2,$3) returning id,name',[name,flags.role||'Accountant',numeric(flags.hours??37.5,'--hours')]);}
  else if(q==='job'){const c=await resolve(db,'clients',flags.client);const s=flags.owner?await resolve(db,'staff',flags.owner):null;result=await db.query('insert into jobs(name,client_id,owner_id,due_date,due_source,budget_hours,fee,currency,work_type) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id,name',[name,c.id,s?.id||null,day(flags.due,'--due'),need(flags.source,'--source'),numeric(flags.budget??0,'--budget'),numeric(flags.fee??0,'--fee'),flags.currency||'NZD',flags.type||'Accounts']);}
  else if(q==='task'||q==='request'){const j=await resolve(db,'jobs',flags.job);result=await db.query(`insert into ${q==='task'?'tasks':'requests'}(job_id,name,due_date) values($1,$2,$3) returning id,name`,[j.id,name,day(flags.due,'--due')]);}
  else throw Error('add client|staff|job|task|request');
 }else if(cmd==='set'){
  if(!['client','job'].includes(q))throw Error('set client|job <name> --field=value');
  const t=q==='client'?'clients':'jobs';const r=await resolve(db,t,rest[0]);
  const allowed=q==='client'?{engagement:'engagement_signed',jurisdiction:'jurisdiction',email:'email',group:'client_group'}:{due:'due_date',source:'due_source','review-due':'review_by',budget:'budget_hours',fee:'fee',retain:'retain_until'};
  const parts=[],vals=[];for(const [flag,col] of Object.entries(allowed)){if(flags[flag]===undefined)continue;const v=['engagement','due','review-due','retain'].includes(flag)?day(flags[flag],flag):['budget','fee'].includes(flag)?numeric(flags[flag],flag):need(flags[flag],flag);vals.push(v);parts.push(`${col}=$${vals.length}`);}
  if(!parts.length)throw Error(`Choose ${Object.keys(allowed).join(', ')}`);vals.push(r.id);result=await db.query(`update ${t} set ${parts.join(',')} where id=$${vals.length} returning id,name`,vals);
 }else if(['task-done','request-received','email-resolve'].includes(cmd)){
  const t={'task-done':'tasks','request-received':'requests','email-resolve':'emails'}[cmd];const r=await resolve(db,t,q);
  const set={'task-done':'done=true','request-received':'received_on=current_date','email-resolve':'resolved=true'}[cmd];result=await db.query(`update ${t} set ${set} where id=$1 returning id`,[r.id]);await db.query('update jobs set last_activity=current_date where id=$1',[r.job_id]);
 }else if(cmd==='roll-forward'){
  const r=await resolve(db,'recurring',q);await db.query('select id from recurring where id=$1 for update',[r.id]);const latest=(await db.query('select * from recurring where id=$1',[r.id]))[0];
  const due=isoDate(latest.next_due);need(flags.period,'--period');
  result=await db.query("insert into jobs(external_id,name,client_id,owner_id,period,due_date,due_source,budget_hours,currency) values($1,$2,$3,$4,$5,$6,'Recurring schedule: confirm statutory date',$7,$8) on conflict(external_id) do nothing returning id,name",[`recurring:${r.id}:${due}`,`${r.name} ${flags.period}`,r.client_id,r.owner_id,flags.period,due,r.budget_hours,flags.currency||'NZD']);
  await db.query("update recurring set next_due=(next_due + interval '1 month'*interval_months)::date where id=$1",[r.id]);
 }else{
  const j=await resolve(db,'jobs',q);await db.query('select id from jobs where id=$1 for update',[j.id]);
  if(cmd==='log'){result=await db.query('insert into notes(job_id,name,kind,actor) values($1,$2,$3,$4) returning id',[j.id,need(flags.text,'--text'),flags.kind||'note',need(flags.actor,'--actor')]);}
  if(cmd==='time'){const s=await resolve(db,'staff',flags.staff);result=await db.query('insert into time_entries(job_id,staff_id,worked_on,hours,rate,billable,note) values($1,$2,coalesce($3::date,current_date),$4,$5,$6,$7) returning id',[j.id,s.id,flags.date?day(flags.date,'--date'):null,numeric(flags.hours,'--hours'),numeric(flags.rate,'--rate'),!flags['non-billable'],need(flags.note,'--note')]);}
  if(cmd==='assign'){const s=await resolve(db,'staff',flags.owner);result=await db.query('update jobs set owner_id=$1 where id=$2 returning id,name',[s.id,j.id]);}
  if(cmd==='status'){if(!['ready','in_progress','waiting','review','cancelled'].includes(rest[0]))throw Error('Use ready|in_progress|waiting|review|cancelled; complete has its own record checks');result=await db.query('update jobs set status=$1 where id=$2 returning id,name,status',[rest[0],j.id]);}
  if(cmd==='complete'){
   const c=(await db.query('select * from clients where id=$1',[j.client_id]))[0];if(c.jurisdiction==='UNKNOWN')throw Error('Confirm client jurisdiction before completion');
   if(!c.engagement_signed)throw Error('Signed engagement must be recorded before completion');
   const pending=await db.query('select id from tasks where job_id=$1 and not done union all select id from requests where job_id=$1 and received_on is null',[j.id]);if(pending.length)throw Error('Resolve outstanding tasks and client requests before completion');
   const s=await resolve(db,'staff',flags.reviewer);const date=day(flags.date,'--date');const until=day(flags.retain,'--retain');
   const valid=(await db.query("select $1::date >= ($2::date + interval '1 year' * $3)::date as ok, $2::date <= current_date as not_future",[until,date,c.jurisdiction==='AU'?5:7]))[0];if(!valid.ok||!valid.not_future)throw Error('Retention too short or service completion date is in the future');
   result=await db.query("update jobs set status='complete',completed_on=$1,reviewed_by=$2,outcome=$3,evidence_ref=$4,retain_until=$5 where id=$6 returning id,name,status",[date,s.id,need(flags.outcome,'--outcome'),need(flags.evidence,'--evidence'),until,j.id]);
  }
  if(cmd==='mark-billed'){result=await db.query('update time_entries set invoiced_ref=$1 where job_id=$2 and billable and invoiced_ref is null returning id',[need(flags.invoice,'--invoice'),j.id]);}
  await db.query('update jobs set last_activity=current_date where id=$1',[j.id]);
 }
 await audit(db,cmd,result[0]?.id||null,JSON.stringify({q,...flags,json:undefined}));await db.exec('commit');return result;
 }catch(e){await db.exec('rollback');throw e;}
}
function display(result){
 if(Array.isArray(result)){if(!result.length)return '(none)';return table(result,Object.keys(result[0]).map(key=>({key,label:key.replaceAll('_',' '),width:48,format:v=>v instanceof Date?v.toISOString().slice(0,10):v})));}
 return Object.entries(result).map(([k,v])=>`${k}\n${display(Array.isArray(v)?v:typeof v==='object'?[v]:[{value:v}])}`).join('\n\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const r=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(r,null,2):display(r));}
 catch(e){if(process.argv.includes('--json'))console.error(JSON.stringify({error:e.message,candidates:e.candidates||[]}));else {console.error(e.message);if(e.candidates?.length)console.error(display(e.candidates));}process.exitCode=1;}
 finally{await db?.close();}
}
