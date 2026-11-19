insert into public.tenant_levels(tenant_id,name,position)
select t.id,v.name,100+v.ord from public.tenants t cross join (values ('RX',1),('Scaled',2),('Hombre',3),('Mujer',4)) v(name,ord)
where not exists(select 1 from public.tenant_levels l where l.tenant_id=t.id and l.name=v.name);