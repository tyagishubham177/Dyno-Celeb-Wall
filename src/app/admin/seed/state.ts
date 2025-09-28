export type SeedActionState = {
  status: "idle" | "success" | "error";
  message: string;
  inserted?: number;
  skipped?: number;
  warnings?: string[];
};

export const initialSeedState: SeedActionState = {
  status: "idle",
  message: "",
};
