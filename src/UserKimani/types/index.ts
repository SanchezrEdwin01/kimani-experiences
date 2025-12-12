export interface User {
	_id: string;
	username: string;
	discriminator: string;
	avatar: {
		_id: string;
		tag: string;
		filename: string;
		metadata: {
			type: string;
		};
		content_type: string;
		size: number;
	};
	badges: number;
	online?: boolean;
	status: {
		presence: string;
	};
}
