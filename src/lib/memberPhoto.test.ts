import { describe, expect, it } from "vitest";
import { MEMBER_PHOTO_MAX_BYTES, photoDrawSize, photoObjectPath, photoProblem } from "./memberPhoto";

describe("member pictures", () => {
  it("stores one JPEG per person inside the household folder", () => {
    expect(photoObjectPath("2b6d9c10-7a4e-4f1b-9c2d-3e5f7a8b9c01", "8d1c6e2a-1f4b-4a1e-8c3d-6b7a9e0f1234")).toBe(
      "2b6d9c10-7a4e-4f1b-9c2d-3e5f7a8b9c01/8d1c6e2a-1f4b-4a1e-8c3d-6b7a9e0f1234.jpg",
    );
  });

  it("accepts JPEG, PNG, and WebP under 12 MB", () => {
    expect(photoProblem({ type: "image/jpeg", size: 2048 })).toBeNull();
    expect(photoProblem({ type: "image/png", size: 2048 })).toBeNull();
    expect(photoProblem({ type: "image/webp", size: MEMBER_PHOTO_MAX_BYTES })).toBeNull();
    expect(photoProblem({ type: "", size: 2048 })).toBeNull();
  });

  it("rejects other formats, empty files, and files over 12 MB", () => {
    expect(photoProblem({ type: "image/gif", size: 2048 })).toBe("Choose a JPEG, PNG, or WebP picture.");
    expect(photoProblem({ type: "image/heic", size: 2048 })).toBe("Choose a JPEG, PNG, or WebP picture.");
    expect(photoProblem({ type: "image/jpeg", size: 0 })).toBe("That picture is empty.");
    expect(photoProblem({ type: "image/jpeg", size: MEMBER_PHOTO_MAX_BYTES + 1 })).toBe("Choose a picture smaller than 12 MB.");
  });

  it("shrinks the long edge to 1280 pixels and keeps smaller pictures", () => {
    expect(photoDrawSize(2000, 1000)).toEqual({ width: 1280, height: 640 });
    expect(photoDrawSize(3000, 3000)).toEqual({ width: 1280, height: 1280 });
    expect(photoDrawSize(100, 200)).toEqual({ width: 100, height: 200 });
    expect(photoDrawSize(0, 0)).toEqual({ width: 1, height: 1 });
  });
});
