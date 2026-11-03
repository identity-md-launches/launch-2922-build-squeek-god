// The optional root lets contributors build using dependencies installed outside this repository.
const dependencyRoot = process.env.SQUEEK_DEPENDENCY_ROOT;
export default {
  base: "./",
  resolve: dependencyRoot
    ? {
        alias: {
          "react-dom": `${dependencyRoot}/react-dom`,
          react: `${dependencyRoot}/react`,
        },
      }
    : undefined,
  build: {
    outDir: "dist",
    target: "es2022",
    assetsDir: "assets",
    sourcemap: false,
  },
};
