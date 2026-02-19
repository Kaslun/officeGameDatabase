-- One upvote per anonymous voter per request (no user accounts).
-- Run in Supabase SQL Editor after game_requests and upvotes column exist.

-- Table: who voted for which request (voter_id = anonymous cookie id from browser)
create table if not exists request_upvotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references game_requests(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz default now(),
  unique(request_id, voter_id)
);

create index if not exists request_upvotes_request_id_idx on request_upvotes(request_id);
create index if not exists request_upvotes_voter_id_idx on request_upvotes(voter_id);

comment on table request_upvotes is 'One row per voter per request; prevents multiple upvotes from same browser (voter_id from cookie).';

alter table request_upvotes enable row level security;

drop policy if exists "Allow insert/select for anon" on request_upvotes;
create policy "Allow insert/select for anon" on request_upvotes
  for all using (true) with check (true);

-- RPC: upvote a request if this voter_id has not already voted.
create or replace function upvote_request(p_request_id uuid, p_voter_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_id uuid;
  v_new_count integer;
begin
  if length(trim(p_voter_id)) < 8 then
    return json_build_object('success', false, 'already_voted', false, 'new_count', null, 'error', 'invalid_voter_id');
  end if;

  insert into request_upvotes (request_id, voter_id)
  values (p_request_id, p_voter_id)
  on conflict (request_id, voter_id) do nothing
  returning id into v_row_id;

  if v_row_id is not null then
    update game_requests set upvotes = upvotes + 1 where id = p_request_id returning upvotes into v_new_count;
    return json_build_object('success', true, 'already_voted', false, 'new_count', v_new_count);
  else
    select upvotes into v_new_count from game_requests where id = p_request_id;
    return json_build_object('success', false, 'already_voted', true, 'new_count', coalesce(v_new_count, 0));
  end if;
end;
$$;
