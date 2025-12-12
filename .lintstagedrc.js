// https://nextjs.org/docs/basic-features/eslint#lint-staged

import path from "path";

const buildEslintCommand = (filenames) =>
	`eslint --fix --max-warnings=0 ${filenames.map((f) => path.relative(process.cwd(), f)).join(" ")}`;

export default {
	"*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}": ["eslint --fix --quiet"],
	"*.*": "prettier --write --ignore-unknown",
};
