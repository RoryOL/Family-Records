import { describe, expect, it } from "vitest";
import { homeTarget, legacyMemberTarget, memberPath, newMemberPath, withoutEdit } from "./paths";

describe("member paths", () => {
  it("keeps profiles on the directory", () => {
    expect(newMemberPath).toBe("/directory/members/new");
    expect(memberPath("mem_elena")).toBe("/directory/members/mem_elena");
    expect(memberPath("a b")).toBe("/directory/members/a%20b");
  });

  it("sends the old birthday address to home and keeps the window", () => {
    expect(homeTarget(new URLSearchParams("within=7"))).toBe("/?within=7");
    expect(homeTarget(new URLSearchParams())).toBe("/");
  });

  it("sends an old member address to the directory and keeps the rest of the query", () => {
    const params = new URLSearchParams("q=harper&edit=1");
    expect(legacyMemberTarget("mem_elena", params)).toBe("/directory/members/mem_elena?q=harper&edit=1");
    expect(legacyMemberTarget(undefined, params)).toBe("/directory/members/new?q=harper&edit=1");
    expect(withoutEdit(params).toString()).toBe("q=harper");
  });
});
