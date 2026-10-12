import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { createMember } from "../lib/members";
import { MemberAvatar } from "./MemberAvatar";
import { MemberCard } from "./MemberCard";
import { MemberForm } from "./MemberForm";
import { emptyFormValues } from "./memberForm";

describe("member picture views", () => {
  it("shows initials until a picture is saved, then the picture itself", () => {
    const member = createMember("grp", {
      firstName: "Elena",
      lastName: "Harper",
      relationship: "Self",
      dateOfBirth: null,
      phone: null,
      email: null,
      address: null,
      notes: "",
    });

    const plain = renderToStaticMarkup(createElement(MemberAvatar, { firstName: "Elena", lastName: "Harper", photoUrl: null }));
    expect(plain).toContain("EH");
    expect(plain).not.toContain("<img");

    const pictured = { ...member, photoUrl: "https://example.test/elena.jpg" };
    const card = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(MemberCard, { member: pictured, to: "/members/elena" })),
    );
    expect(card).toContain('src="https://example.test/elena.jpg"');
    expect(card).toContain("Elena Harper");
  });

  it("offers add, change, and remove on the member form", () => {
    const fresh = renderToStaticMarkup(
      createElement(MemberForm, {
        initial: emptyFormValues(),
        suggestions: [],
        onSave: () => undefined,
        onDirtyChange: () => undefined,
      }),
    );
    expect(fresh).toContain("Add picture");
    expect(fresh).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(fresh).not.toContain("Remove picture");

    const saved = renderToStaticMarkup(
      createElement(MemberForm, {
        initial: { ...emptyFormValues(), firstName: "Elena", lastName: "Harper" },
        suggestions: [],
        photoUrl: "https://example.test/elena.jpg",
        hasPhoto: true,
        onSave: () => undefined,
        onDirtyChange: () => undefined,
      }),
    );
    expect(saved).toContain("Change picture");
    expect(saved).toContain("Remove picture");
    expect(saved).toContain('src="https://example.test/elena.jpg"');
  });
});
