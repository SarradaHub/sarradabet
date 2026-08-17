import { BadRequestError } from "../../../core/errors/AppError";
import { validateImageFile } from "../utils/validateImageFile";

jest.mock("../../../config/env", () => ({
  config: {
    UPLOAD_MAX_BYTES: 2097152,
  },
}));

describe("validateImageFile", () => {
  it("accepts allowed image MIME types within size limit", () => {
    expect(() => validateImageFile("image/jpeg", 1024)).not.toThrow();
    expect(() => validateImageFile("image/png", 1024)).not.toThrow();
    expect(() => validateImageFile("image/webp", 1024)).not.toThrow();
  });

  it("rejects unsupported MIME types", () => {
    expect(() => validateImageFile("application/pdf", 1024)).toThrow(
      BadRequestError,
    );
    expect(() => validateImageFile("text/plain", 512)).toThrow(BadRequestError);
  });

  it("rejects files larger than UPLOAD_MAX_BYTES", () => {
    expect(() => validateImageFile("image/jpeg", 2097153)).toThrow(
      BadRequestError,
    );
  });
});
