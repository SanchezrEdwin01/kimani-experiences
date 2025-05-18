// src/constants/env.ts
export const BASE_URL: string = process.env.NEXT_PUBLIC_BASE_URL ?? "https://staging.kimanilife.com";

export const API_URL: string = process.env.NEXT_PUBLIC_API_URL ?? "https://staging.kimanilife.com/api";

export const AUTUMN_API_URL: string =
	process.env.NEXT_PUBLIC_AUTUMN_API_URL ?? "https://staging.kimanilife.com/autumn";

export const PLATFORM_URL: string = `${BASE_URL}/service-providers`;

export const DEFAULT_SERVER_ID: string =
	process.env.NEXT_PUBLIC_DEFAULT_SERVER_ID ?? "01HP41709DFJP1DRSTSA88J81A";

export const GOOGLE_MAPS_API_KEY: string =
	process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "AIzaSyAHFo6a0yqcyCnr1nZn4n65GF1DzVcb6uY";

// constantes de negocio, sin cambio
export const BASE_URL_KEY = "base_url";
export const EVENT_TYPE_ALL = "all";
export const EVENT_TYPE_KIMANI = "KimaniEvent";
export const EVENT_TYPE_MEMBER = "MembersEvent";
export const EVENT_TYPE_OTHER = "Other";
export const TAB_MY_EVENTS = "my_events";
export const TAB_SAVED_EVENTS = "saved_events";
export const TAB_ALL = "all";
export const CATEGORY = "Category";
export const ADMIN_CATEGORY = "admin_ategory";
export const ADMIN_EVENT_PLANNING = "admin_Category";
export const MANAGE_PROVIDER = "manage-servie-provider";
export const MANAGE_PROVIDER_DETAIL = "manage-servie-provider-detail";

export const ART_CATEGORY_SLUG = "art";
export const ADMIN_ART_CATEGORIES_PAGE_VALUE = "admin_art_categories_page";
export const ADMIN_ART_CATEGORY_CONTENT_VALUE = "admin_art_category_content";
export const ADMIN_ART_SUBCATEGORY_CREATE_PAGE_VALUE = "admin_art_subcategory_create_page";
export const ART_PRODUCT_CREATE_ROUTE_VALUE = "art_product_create_page";

export const REAL_ESTATE_CATEGORY_SLUG = "real-estate";
export const ADMIN_REAL_ESTATE_CATEGORIES_PAGE_VALUE = "admin_real_estate_categories_page";
export const ADMIN_REAL_ESTATE_CATEGORY_CONTENT_VALUE = "admin_real_estate_category_content";
export const ADMIN_REAL_ESTATE_SUBCATEGORY_CREATE_PAGE_VALUE = "admin_real_estate_subcategory_create_page";

export const LUXURY_GOODS_CATEGORY_SLUG = "luxury-goods";
export const ADMIN_LUXURY_GOODS_CATEGORIES_PAGE_VALUE = "admin_luxury_goods_categories_page";
export const ADMIN_LUXURY_GOODS_CATEGORY_CONTENT_VALUE = "admin_luxury_goods_category_content";
export const ADMIN_LUXURY_GOODS_SUBCATEGORY_CREATE_PAGE_VALUE = "admin_luxury_goods_subcategory_create_page";

export const TYPES = [
	{ name: "Real estate", value: EVENT_TYPE_ALL, route: "marketplace/real-estate" },
	{ name: "Art", value: EVENT_TYPE_KIMANI, route: "marketplace/art" },
	{ name: "Service provider", value: EVENT_TYPE_MEMBER, route: "/marketplace/service-providers" },
	{ name: "Luxury goods", value: EVENT_TYPE_OTHER, route: "marketplace/luxury-goods" },
	{ name: "Category", value: CATEGORY, route: "marketplace/service-providers/category" },
	{ name: "Admin Category", value: ADMIN_CATEGORY, route: "marketplace/service-providers/admin-category" },
	{
		name: "Admin Event Planning",
		value: ADMIN_EVENT_PLANNING,
		route: "marketplace/service-providers/admin-category/event-planning",
	},
	{ name: "Manage provider", value: MANAGE_PROVIDER, route: "marketplace/service-providers/admin-provider" },
	{
		name: "Manage provider detail",
		value: MANAGE_PROVIDER_DETAIL,
		route: "marketplace/service-providers/admin-provider/details",
	},
	{
		name: "Admin Art Categories",
		value: ADMIN_ART_CATEGORIES_PAGE_VALUE,
		route: "marketplace/art/admin-categories",
	},
	{
		name: "Admin Art Category Content",
		value: ADMIN_ART_CATEGORY_CONTENT_VALUE,
		route: "marketplace/art/admin-categories",
	},
	{
		name: "Admin Art SubCategory Create",
		value: ADMIN_ART_SUBCATEGORY_CREATE_PAGE_VALUE,
		route: "marketplace/art/admin-categories/create",
	},
	{
		name: "Art Product Create",
		value: ART_PRODUCT_CREATE_ROUTE_VALUE,
		route: "marketplace/art/create-art",
	},
	{
		name: "Admin Real Estate Categories",
		value: ADMIN_REAL_ESTATE_CATEGORIES_PAGE_VALUE,
		route: "marketplace/real-estate/admin-categories",
	},
	{
		name: "Admin Real Estate Category Content",
		value: ADMIN_REAL_ESTATE_CATEGORY_CONTENT_VALUE,
		route: "marketplace/real-estate/admin-categories",
	},
	{
		name: "Admin Real Estate SubCategory Create",
		value: ADMIN_REAL_ESTATE_SUBCATEGORY_CREATE_PAGE_VALUE,
		route: "marketplace/real-estate/admin-categories/create",
	},
	{
		name: "Admin Luxury Goods Categories",
		value: ADMIN_LUXURY_GOODS_CATEGORIES_PAGE_VALUE,
		route: "marketplace/luxury-goods/admin-categories",
	},
	{
		name: "Admin Luxury Goods Category Content",
		value: ADMIN_LUXURY_GOODS_CATEGORY_CONTENT_VALUE,
		route: "marketplace/luxury-goods/admin-categories",
	},
	{
		name: "Admin Luxury Goods SubCategory Create",
		value: ADMIN_LUXURY_GOODS_SUBCATEGORY_CREATE_PAGE_VALUE,
		route: "marketplace/luxury-goods/admin-categories/create",
	},
];
