export enum EventType {
	KIMANI = "kimani",
	MEMBER = "member",
	OTHER = "other",
}

export interface AttachmentResponse {
	id: string;
	url?: string;
	content_type?: string;
}

export interface TicketConfig {
	is_paid: boolean;
	allow_multiple_tickets: boolean;
}

export interface CreateEventPayload {
	title: string;
	event_type: "MembersEvent";
	start_date: string;
	end_date: string;
	city: string;
	area: string;
	address: string;
	hosts: string[];
	sponsors: string[];
	ticket_config: TicketConfig;
	description?: string;
	gallery?: string[];
	attachments?: string[];
}

export interface Event {
	id: string;
	title: string;
	description: string;
	plus_one_count: number;
	requires_plus_one_info: boolean;
	allow_plus_one_amount: number;
	requires_rsvp_approval: boolean;
	show_to_non_members: boolean;
	allow_plus_one: boolean;
	plusOneInfo: {
		name: string;
		email: string;
		phone: string;
		address: string;
		city: string;
	}[];
	start_date: string;
	hosts: string[];
	sponsors: string[];
	gallery: string[];
	attachments: string[];
	thumbnail: string;
	end_date: string;
	location: string;
	city: string;
	area: string;
	address: string;
	hide_address: boolean;
	category: string;
	event_type: EventType;
	organizer: {
		name: string;
		id: string;
	};
	attendees?: {
		id: string;
		name: string;
	}[];
	status?: "upcoming" | "past" | "cancelled";
	imageUrl?: string;
}

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
	status: {
		presence: string;
	};
}
