import {readFileSync} from 'node:fs';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import path from 'node:path';
const db=await getDb();
try { await db.exec('begin'); await db.exec(readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8')); await db.exec('commit'); console.log('Seeded Harbour Practice demo (idempotent).'); }
catch(e){await db.exec('rollback');throw e;} finally {await db.close();}
