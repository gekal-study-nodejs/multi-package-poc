import { defineConfig, type Options } from "tsup";

/** 全パッケージ共通の tsup 設定。各パッケージで entry のみ差し替える。 */
export function baseConfig(options: Options = {}): Options {
  return {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: "es2022",
    ...options,
  };
}

export default defineConfig(baseConfig());
