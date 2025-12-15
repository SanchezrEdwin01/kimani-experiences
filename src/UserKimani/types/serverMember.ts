export interface ServerMember {
	_id: {
		server: string;
		user: string;
	};
	joined_at: string;
	roles: string[];
}
