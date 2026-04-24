export type PackageSearchRow = {
  package: {
    name: string;
    description: string;
    category: string;
    totalDownloads: number;
    updatedAtUtc: string;
  };
};

export type PackageDetails = {
  package: {
    name: string;
  };
  versions: Array<{ version: string; publishedAtUtc: string }>;
  dependencies: Array<{ name: string; source: string; version?: string }>;
  dependentsCount: number;
};
