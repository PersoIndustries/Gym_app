import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { assertOk, result } from "./gym";
import type { Database } from "@/integrations/supabase/types";
export type Facility = Database["public"]["Tables"]["facilities"]["Row"];
export const facilitiesQuery = (tenant: string | null) => queryOptions({ queryKey: ["facilities",tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("facilities").select("*").eq("tenant_id",tenant).order("name")) : [] });
export const reservationsQuery = (tenant: string | null) => queryOptions({ queryKey: ["reservations",tenant], enabled: !!tenant, queryFn: async () => tenant ? result(await supabase.from("facility_reservations").select("*").eq("tenant_id",tenant).order("starts_at",{ascending:false}).limit(500)) : [] });
export const availabilityQuery = (id: string, day: string) => queryOptions({ queryKey:["availability",id,day], enabled:!!id, queryFn:async()=>id ? result(await supabase.rpc("facility_availability",{_facility:id,_from:new Date(`${day}T00:00:00`).toISOString(),_to:new Date(`${day}T23:59:59`).toISOString()})) : [] });
export async function requestFacility(id:string,start:string) { return result(await supabase.rpc("request_facility",{_facility:id,_start:new Date(start).toISOString()})); }
export async function changeReservation(id:string,status:string) { assertOk(await supabase.rpc("change_facility_reservation",{_reservation:id,_status:status})); }
export async function saveFacility(tenant:string,id:string|null,f:{name:string;kind:string;slot_minutes:number;approval_required:boolean;opens_at:string;closes_at:string;active:boolean}) { if(!f.name.trim())throw new Error("Escribe el nombre del espacio"); if(id)assertOk(await supabase.from("facilities").update(f).eq("id",id).eq("tenant_id",tenant)); else assertOk(await supabase.from("facilities").insert({...f,tenant_id:tenant})); }