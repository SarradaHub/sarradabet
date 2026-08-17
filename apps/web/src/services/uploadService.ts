import { uploadMultipart } from "./apiClient";

export async function uploadRewardImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const result = (await uploadMultipart(
    "admin/uploads/reward-image",
    formData,
  )) as { url: string };

  return result.url;
}
