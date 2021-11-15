-- Telegram known chats
create table chat(
	id bigint not null primary key, 
	register_timestmap timestamp not null default current_timestamp
);

-- dummy table for notifications test
create table client(
	id serial not null primary key,
	name varchar(24) not null,
	active boolean not null default true,
	employees_quantity int not null default 0 check(employees_quantity >= 0),
	register_timestamp timestamp not null default current_timestamp
);

-- notify trigger function for client table
create or replace function client_observer() returns trigger as $$
begin
	execute pg_notify('db_change', format('%s:%s:%s', TG_TABLE_NAME, NEW.id, TG_OP));
	return NEW;
end;
$$ language plpgsql;

-- install notify trigger function on client table
create trigger client_observer 
after insert or update 
on client 
for each row execute function client_observer();