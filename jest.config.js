module.exports = {
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/migrations/**",
        "!src/seeders/**",
        "!src/config/**",
        "!**/node_modules/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
    testTimeout: 30000,
    verbose: true,
};
