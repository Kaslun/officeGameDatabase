-- Allow voters to remove their upvote (toggle off).
-- Run in Supabase SQL Editor after migration_one_upvote_per_voter.sql.

create or replace function remove_upvote(p_request_id uuid, p_voter_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
  v_new_count integer;
begin
  if length(trim(p_voter_id)) < 8 then
    return json_build_object('success', false, 'new_count', null, 'error', 'invalid_voter_id');
  end if;

  delete from request_upvotes
  where request_id = p_request_id and voter_id = p_voter_id;

  get diagnostics v_deleted = row_count;

  if v_deleted > 0 then
    update game_requests
    set upvotes = greatest(0, upvotes - 1)
    where id = p_request_id
    returning upvotes into v_new_count;
    return json_build_object('success', true, 'new_count', v_new_count);
  else
    select upvotes into v_new_count from game_requests where id = p_request_id;
    return json_build_object('success', false, 'new_count', coalesce(v_new_count, 0));
  end if;
end;
$$;

grant execute on function remove_upvote(uuid, text) to anon;
