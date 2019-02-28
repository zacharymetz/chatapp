Create Table account(
	accountid serial PRIMARY KEY,
	publickey text not null,
	privatekey text not null,
	created_at timestamp with time zone not null
);


Create Table nickname(
	nicknameid serial PRIMARY KEY,
	accountid int not null REFERENCES account(accountid),
	name text not null,
	color int default 0, /*	the hedidecimal value for the color of the user's name  */
	created_at timestamp with time zone not null
	
);

Create Table chatroom(
	chatroomid serial PRIMARY KEY,
	created_by int REFERENCES account(accountid),
	name text not null,
	hash text not null,
	created_at timestamp with time zone not null
);

Create Table message(
	messageid serial PRIMARY KEY,
	created_by int REFERENCES account(accountid),
	created_in int REFERENCES chatroom(chatroomid),
	message text not null,
	created_at timestamp with time zone not null
);


CREATE TABLE account_chatroom(
    account_chatroomid serial PRIMARY KEY,
	accountid int REFERENCES account(accountid) not null,
	chatroomid int REFERENCES chatroom(chatroomid) not null,
	date_joined timestamp with time zone not null
);


