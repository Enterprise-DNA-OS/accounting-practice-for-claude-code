insert into staff(id,name,role,weekly_hours) values
 ('10000000-0000-0000-0000-000000000001','Mia Chen','Partner',12),
 ('10000000-0000-0000-0000-000000000002','Aroha Wilson','Accountant',32),
 ('10000000-0000-0000-0000-000000000003','Ben Patel','Bookkeeper',30) on conflict do nothing;
insert into clients(id,name,email,client_group,jurisdiction,owner_id,engagement_signed) values
 ('20000000-0000-0000-0000-000000000001','Harbour Foods Ltd','accounts@harbour.example','Harbour','NZ','10000000-0000-0000-0000-000000000001',current_date-180),
 ('20000000-0000-0000-0000-000000000002','Harbour Family Trust','trust@harbour.example','Harbour','NZ','10000000-0000-0000-0000-000000000001',null),
 ('20000000-0000-0000-0000-000000000003','Banksia Consulting Pty Ltd','accounts@banksia.example','Banksia','AU','10000000-0000-0000-0000-000000000001',current_date-100),
 ('20000000-0000-0000-0000-000000000004','Koru Design Ltd','accounts@koru.example','Koru','NZ','10000000-0000-0000-0000-000000000001',current_date-90) on conflict do nothing;
insert into jobs(id,name,client_id,owner_id,work_type,status,due_date,due_source,budget_hours,fee,currency,review_by,last_activity) values
 ('30000000-0000-0000-0000-000000000001','Harbour annual accounts','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','Annual accounts','waiting',current_date-3,'Demo agreed deadline',18,3200,'NZD',current_date-1,current_date-12),
 ('30000000-0000-0000-0000-000000000002','Harbour trust return','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Tax return','ready',current_date+4,'Demo client-specific deadline',25,4200,'NZD',current_date+2,current_date-8),
 ('30000000-0000-0000-0000-000000000003','Banksia BAS review','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','BAS','review',current_date+2,'Demo agent-confirmed date',8,1800,'AUD',current_date-2,current_date-4),
 ('30000000-0000-0000-0000-000000000004','Koru monthly books','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003','Bookkeeping','in_progress',current_date+6,'Demo agreed deadline',6,950,'NZD',current_date+5,current_date-2),
 ('30000000-0000-0000-0000-000000000005','Banksia year end','20000000-0000-0000-0000-000000000003',null,'Annual accounts','ready',null,null,20,5000,'AUD',null,current_date-10) on conflict do nothing;
insert into tasks(id,job_id,name,owner_id,due_date) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Reconcile inventory','10000000-0000-0000-0000-000000000002',current_date-5),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003','Partner review','10000000-0000-0000-0000-000000000001',current_date-2) on conflict do nothing;
insert into requests(id,job_id,name,due_date,last_chased) values
 ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Closing stock valuation',current_date-7,current_date-8),
 ('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Trustee distribution minutes',current_date+1,null) on conflict do nothing;
insert into time_entries(id,job_id,staff_id,worked_on,hours,rate,note) values
 ('60000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',current_date-35,12,180,'Reconciliation and workpapers'),
 ('60000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',current_date-12,8,180,'Stock reconciliation follow-up'),
 ('60000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',current_date-4,6,220,'BAS preparation'),
 ('60000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003',current_date-2,3,120,'Monthly reconciliation') on conflict do nothing;
insert into emails(id,external_id,job_id,name,received_on,owner_id) values
 ('70000000-0000-0000-0000-000000000001','demo-mail-1','30000000-0000-0000-0000-000000000001','Stock count still outstanding',current_date-10,'10000000-0000-0000-0000-000000000002') on conflict do nothing;
insert into recurring(id,name,client_id,owner_id,interval_months,next_due,budget_hours) values
 ('80000000-0000-0000-0000-000000000001','Koru monthly books','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003',1,current_date+28,6) on conflict do nothing;
insert into notes(id,job_id,name,kind,actor) values
 ('90000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Owner promised the stock count on Friday.','call','Aroha Wilson') on conflict do nothing;
