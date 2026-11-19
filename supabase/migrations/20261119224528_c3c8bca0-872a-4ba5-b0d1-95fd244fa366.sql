revoke execute on function public.validate_event(), public.validate_item_level(), public.validate_participant() from public, anon, authenticated;
revoke execute on function public.event_attendees(uuid,uuid) from public, anon;
grant execute on function public.event_attendees(uuid,uuid) to authenticated;