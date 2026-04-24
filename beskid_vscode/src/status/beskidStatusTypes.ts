export interface BeskidStatusParams {
  source: string;
  phase: string;
  message?: string;
  current?: number;
  total?: number;
  active: boolean;
}
