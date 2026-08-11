import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../../tsconfig.spec.json" }],
  },
  moduleNameMapper: {
    "^@roofsteel/shared-types$": "<rootDir>/../../packages/shared-types/src/index.ts",
  },
  clearMocks: true,
};

export default config;
