import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageUploadField } from "../ImageUploadField";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File) => file),
}));

vi.mock("../../../services/uploadService", () => ({
  uploadRewardImage: vi.fn(),
}));

import imageCompression from "browser-image-compression";
import { uploadRewardImage } from "../../../services/uploadService";

describe("ImageUploadField", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows preview after successful upload", async () => {
    vi.mocked(uploadRewardImage).mockResolvedValue(
      "https://example.supabase.co/storage/v1/object/public/reward-images/rewards/test.webp",
    );

    render(<ImageUploadField value="" onChange={onChange} />);

    const file = new File(["image"], "reward.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(imageCompression).toHaveBeenCalled();
      expect(uploadRewardImage).toHaveBeenCalledWith(file);
      expect(onChange).toHaveBeenCalledWith(
        "https://example.supabase.co/storage/v1/object/public/reward-images/rewards/test.webp",
      );
    });
  });

  it("rejects non-image files", async () => {
    render(<ImageUploadField value="" onChange={onChange} />);

    const file = new File(["pdf"], "document.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("Formato não suportado. Use JPG, PNG ou WebP."),
      ).toBeInTheDocument();
    });

    expect(uploadRewardImage).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
