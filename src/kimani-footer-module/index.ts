// Kimani Footer Module v2 - Entry point
// Módulo autocontenido para Next.js

// Components
export { Footer } from "./components/Footer";
export { UserIcon, useStatusColour } from "./components/UserIcon";

// Store & Hooks
export { useUserStore, useBaseURL, useKimaniUser, generateFileURL } from "./stores/userStore";

// Types
export type { User, UserStatus } from "./stores/userStore";
