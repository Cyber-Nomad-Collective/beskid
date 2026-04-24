import type { PackageDetails, PackageSearchRow } from "./pckgTypes.js";

async function fetchPckgJson<T>(baseUrl: string, pathname: string, searchParams: Record<string, string>): Promise<T | undefined> {
  try {
    const url = new URL(pathname, baseUrl);
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

export async function searchPackages(baseUrl: string, query: string): Promise<PackageSearchRow[] | undefined> {
  const params: Record<string, string> = { limit: "50" };
  if (query.length > 0) {
    params.q = query;
  }
  const data = await fetchPckgJson<PackageSearchRow[]>(baseUrl, "/api/search", params);
  return Array.isArray(data) ? data : undefined;
}

export async function getPackageDetails(baseUrl: string, packageName: string): Promise<PackageDetails | undefined> {
  return fetchPckgJson<PackageDetails>(
    baseUrl,
    `/api/packages/${encodeURIComponent(packageName)}`,
    {},
  );
}
