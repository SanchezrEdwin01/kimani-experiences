import { invariant } from "ts-invariant";
import { type TypedDocumentString } from "../gql/graphql";

invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

type GraphQLErrorResponse = {
	errors: readonly {
		message: string;
	}[];
};

type GraphQLRespone<T> = { data: T } | GraphQLErrorResponse;

export const ProductsPerPage = 12;

export async function executeGraphQL<Result, Variables>(
	operation: TypedDocumentString<Result, Variables>,
	options: {
		headers?: HeadersInit;
		cache?: RequestCache;
		revalidate?: number;
	} & (Variables extends Record<string, never> ? { variables?: never } : { variables: Variables }),
): Promise<Result> {
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");
	const appToken = process.env.NEXT_PUBLIC_SALEOR_APP_TOKEN;
	invariant(appToken, "Missing SALEOR_APP_TOKEN env variable");

	const { variables, headers, cache, revalidate } = options;

	const response = await fetch(process.env.NEXT_PUBLIC_SALEOR_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${appToken}`,
			...headers,
		},
		body: JSON.stringify({
			query: operation.toString(),
			...(variables && { variables }),
		}),
		cache: cache,
		next: { revalidate },
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new HTTPError(response, body);
	}

	const body = (await response.json()) as GraphQLRespone<Result>;
	if ("errors" in body) throw new GraphQLError(body);
	return body.data;
}

export class GraphQLError extends Error {
	constructor(public errorResponse: GraphQLErrorResponse) {
		const message = errorResponse.errors.map((error) => error.message).join("\n");
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
export class HTTPError extends Error {
	constructor(response: Response, body: string) {
		const message = `HTTP error ${response.status}: ${response.statusText}\n${body}`;
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export const formatMoney = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount);

export const formatMoneyRange = (
	range: {
		start?: { amount: number; currency: string } | null;
		stop?: { amount: number; currency: string } | null;
	} | null,
) => {
	const { start, stop } = range || {};
	const startMoney = start && formatMoney(start.amount, start.currency);
	const stopMoney = stop && formatMoney(stop.amount, stop.currency);

	if (startMoney === stopMoney) {
		return startMoney;
	}

	return `${startMoney} - ${stopMoney}`;
};

export async function uploadGraphQL<Result, Variables>(
	operation: TypedDocumentString<Result, Variables>,
	variables: Variables,
): Promise<Result> {
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing URL");
	const appToken = process.env.NEXT_PUBLIC_SALEOR_APP_TOKEN!;

	const varObj = variables as Record<string, unknown>;

	const operations = JSON.stringify({
		query: operation.toString(),
		variables: Object.fromEntries(
			Object.entries(varObj).map(([k, v]) => (v instanceof File ? [k, null] : [k, v])),
		),
	});

	const map: Record<string, string[]> = {};
	let fileIndex = 0;
	for (const [key, value] of Object.entries(varObj)) {
		if (value instanceof File) {
			map[String(fileIndex)] = [`variables.${key}`];
			fileIndex++;
		}
	}

	const body = new FormData();
	body.append("operations", operations);
	body.append("map", JSON.stringify(map));

	fileIndex = 0;
	for (const value of Object.values(varObj)) {
		if (value instanceof File) {
			body.append(String(fileIndex), value, value.name);
			fileIndex++;
		}
	}

	const res = await fetch(process.env.NEXT_PUBLIC_SALEOR_API_URL!, {
		method: "POST",
		credentials: "include",
		headers: { Authorization: `Bearer ${appToken}` },
		body,
	});

	const json = (await res.json()) as GraphQLRespone<Result>;
	if ("errors" in json) throw new GraphQLError(json);
	return json.data;
}
