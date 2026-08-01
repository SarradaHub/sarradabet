import axios from "axios";
import { getApiRootUrl } from "../services/apiClient";

function resolveApiUrl(path: string): string {
  const root = getApiRootUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
  accessToken: string | null,
): Promise<void> {
  const response = await axios.get(resolveApiUrl(path), {
    responseType: "blob",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    withCredentials: true,
  });

  const blobUrl = URL.createObjectURL(response.data as Blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
}

export async function fetchAuthenticatedBlob(
  path: string,
  accessToken: string | null,
): Promise<string> {
  const response = await axios.get(resolveApiUrl(path), {
    responseType: "blob",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    withCredentials: true,
  });

  return URL.createObjectURL(response.data as Blob);
}
