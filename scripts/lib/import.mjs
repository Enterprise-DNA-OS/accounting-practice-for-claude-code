import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import {resolve} from '../practice.mjs';
const norm=s=>String(s).trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
 clients:{external_id:['Contact Key','Contact ID','Key','Client Identifier'],name:['Name','Organization Name','Organisation Name','Full Name'],first:['First Name'],last:['Last Name'],email:['Email','Email Address','Primary Email Address'],client_group:['Client Group','Group'],owner:['Client Owner','Client Manager']},
 jobs:{external_id:['Work Key','Work ID','Key'],name:['Work Title','Title','Work Name','Name'],client:['Client','Client Name','Contact','Contact Name'],owner:['Assignee','Assigned To','Work Assignee'],status:['Status','Work Status'],due:['Due Date','Due'],type:['Work Type','Type'],budget:['Budget Hours','Budgeted Hours'],period:['Period','Accounting Period']},
 emails:{external_id:['Message ID','ID'],name:['Subject'],job:['Job','Work Title'],received:['Received Date'],owner:['Owner']}
};
function date(v){if(v instanceof Date)return v.toISOString().slice(0,10);const s=String(v||'').trim();if(!s)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Date '${s}' needs YYYY-MM-DD; convert regional dates explicitly`);return s;}
async function rowsFrom(file,flags){
 if(/\.csv$/i.test(file))return parse(fs.readFileSync(file,'utf8'),{columns:h=>{if(new Set(h.map(norm)).size!==h.length)throw Error('Duplicate CSV headers');return h;},bom:true,skip_empty_lines:true,trim:true});
 if(!/\.xlsx$/i.test(file))throw Error('Use a CSV or XLSX file');
 const wb=new ExcelJS.Workbook();await wb.xlsx.readFile(file);
 const nonempty=wb.worksheets.filter(w=>w.rowCount>1);
 const sheet=flags.sheet?wb.getWorksheet(String(flags.sheet)):nonempty.length===1?nonempty[0]:null;
 if(!sheet)throw Error(`Choose --sheet=<name> from: ${nonempty.map(w=>w.name).join(', ')}`);
 const values=cell=>{const v=cell.value;if(v&&typeof v==='object'&&!(v instanceof Date)){if(v.formula||v.sharedFormula)throw Error('Formula cells are not imported; save values first');if(v.richText)return v.richText.map(t=>t.text).join('');if(v.text)return v.text;throw Error('Unsupported spreadsheet cell');}return v??'';};
 const headers=sheet.getRow(1).values.slice(1).map(String);if(new Set(headers.map(norm)).size!==headers.length)throw Error('Duplicate spreadsheet headers');
 const out=[];sheet.eachRow((r,n)=>{if(n===1)return;const o={};headers.forEach((h,i)=>o[h]=values(r.getCell(i+1)));if(Object.values(o).some(x=>String(x).trim()))out.push(o);});return out;
}
export async function importFile(db,file,flags){
 const kind=String(flags.kind||'');if(!aliases[kind])throw Error('--kind=clients|jobs|emails required');
 const rows=await rowsFrom(file,flags);if(!rows.length)throw Error('No records in file');
 const fields=aliases[kind];const known=new Set(Object.values(fields).flat().map(norm));
 const ignored=[...new Set(rows.flatMap(Object.keys))].filter(k=>!known.has(norm(k)));
 const report={kind,rows:rows.length,inserted:0,skipped:0,applied:!!flags.apply,ignored_columns:ignored,warnings:[]};
 const seen=new Set();await db.exec('begin');
 try{for(let i=0;i<rows.length;i++){
  try{
   const raw=rows[i],r={};for(const [k,names] of Object.entries(fields)){const name=Object.keys(raw).find(h=>names.map(norm).includes(norm(h)));r[k]=name?raw[name]:'';}
   if(kind==='clients'&&!r.name)r.name=[r.first,r.last].filter(Boolean).join(' ');
   if(!String(r.name).trim())throw Error('Missing name/title');
   const name=String(r.name).trim();const id=r.external_id?`karbon:${kind}:${r.external_id}`:`karbon:${kind}:name:${createHash('sha256').update(name.toLowerCase()).digest('hex')}`;
   if(seen.has(id))throw Error('Duplicate source key/name within file');seen.add(id);
   if(!r.external_id)report.warnings.push(`Row ${i+2}: no source key; name-based identity used`);
   let result;
   const owner=r.owner?await resolve(db,'staff',String(r.owner)):null;
   if(kind==='clients'){
    result=await db.query('insert into clients(external_id,name,email,client_group,owner_id,jurisdiction) values($1,$2,$3,$4,$5,$6) on conflict(external_id) do nothing returning id',[id,name,r.email||null,r.client_group||null,owner?.id||null,flags.jurisdiction||'UNKNOWN']);
   }else if(kind==='jobs'){
    const c=await resolve(db,'clients',String(r.client||''));const states={'planned':'ready','ready to start':'ready','not started':'ready','ready':'ready','in progress':'in_progress','in_progress':'in_progress','waiting':'waiting','waiting for client':'waiting','review':'review','in review':'review','completed':'review','complete':'review','cancelled':'cancelled'};
    const status=String(r.status||'ready').toLowerCase().trim();if(!states[status])throw Error(`Unmapped status '${status}'; map it before importing`);
    if(status==='complete'||status==='completed')report.warnings.push(`Row ${i+2}: completed work imported for review until outcome and retention are confirmed`);
    const budget=r.budget===''?0:Number(r.budget);if(!Number.isFinite(budget)||budget<0)throw Error('Invalid budget hours');
    if(!flags.currency)throw Error('--currency=NZD|AUD|USD required for work import');
    result=await db.query('insert into jobs(external_id,name,client_id,owner_id,status,due_date,due_source,work_type,budget_hours,period,currency) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict(external_id) do nothing returning id',[id,name,c.id,owner?.id||null,states[status],date(r.due),'Karbon export: practitioner must verify',r.type||'Accounts',budget,r.period||'',flags.currency]);
   }else{
    if(!r.external_id)throw Error('Message ID required');const j=await resolve(db,'jobs',String(r.job||''));const received=date(r.received);if(!received)throw Error('Received Date required');
    result=await db.query('insert into emails(external_id,name,job_id,received_on,owner_id) values($1,$2,$3,$4,$5) on conflict(external_id) do nothing returning id',[id,name,j.id,received,owner?.id||null]);
   }
   result.length?report.inserted++:report.skipped++;
  }catch(e){throw Error(`Row ${i+2}: ${e.message}`);}
 }
 if(flags.apply){await db.query('insert into audit(action,detail) values($1,$2)',['import',JSON.stringify(report)]);await db.exec('commit');}else await db.exec('rollback');return report;
 }catch(e){await db.exec('rollback');throw e;}
}
