const requiredServerEnv = ["DATABASE_URL"] as const;

type ServerEnvKey = (typeof requiredServerEnv)[number];

type ServerEnv = Record<ServerEnvKey, string>;

let cachedEnv: ServerEnv | null = null;

export const loadServerEnv = (): ServerEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const missing = requiredServerEnv.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  cachedEnv = {
    DATABASE_URL: process.env.DATABASE_URL!,
  } satisfies ServerEnv;

  return cachedEnv;
};
