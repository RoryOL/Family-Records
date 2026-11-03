import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../data/mockFamily";
import type { FamilyContextValue } from "../store/FamilyProvider";
import type { Member } from "../types";

const { family } = vi.hoisted(() => ({
  family: { current: null as FamilyContextValue | null },
}));

vi.mock("../store/FamilyProvider", () => ({
  useFamily: () => {
    if (!family.current) throw new Error("family fixture is missing");
    return family.current;
  },
  FamilyProvider: ({ children }: { children: unknown }) => children,
}));

import { AppRoutes } from "../App";

describe("home and your details", () => {
  beforeEach(() => {
    family.current = sampleFamily();
  });

  it("opens on the birthday home, with Home as the first tab", () => {
    const html = renderAt("/");
    const nav = primaryNav(html);

    expect(tabLabels(nav)).toEqual(["Home", "You", "Directory", "Tree", "Mailing", "Import"]);
    expect(currentTab(nav)).toBe("Home");
    expect(html).toContain(">Home</h1>");
    expect(html).toContain("Upcoming birthdays and wedding anniversaries");
    expect(html).toContain("Download calendar");
    expect(html).not.toContain("Add member");
    expect(html).not.toMatch(/href="\/members\//);
  });

  it("keeps the directory on its own tab and opens a profile there", () => {
    const html = renderAt("/directory");
    expect(currentTab(primaryNav(html))).toBe("Directory");
    expect(html).toContain("Add member");
    expect(html).toContain('href="/directory/members/mem_elena"');
    expect(html).toContain('href="/me"');
    expect(html).not.toContain('href="/me?edit=1"');

    const profile = renderAt("/directory/members/mem_elena");
    expect(currentTab(primaryNav(profile))).toBe("Directory");
    expect(profile).toContain("Edit profile");
    expect(profile).toContain("(503) 555-0142");
  });

  it("shows your details in read mode until edit is chosen", () => {
    const reading = renderAt("/me");
    expect(currentTab(primaryNav(reading))).toBe("You");
    expect(reading).toContain(">Elena Harper</h1>");
    expect(reading).toContain("Edit your details");
    expect(reading).toContain("(503) 555-0142");
    expect(reading).not.toContain('id="member-form"');
    expect(reading).not.toContain("Save your details");

    const editing = renderAt("/me?edit=1");
    expect(editing).toContain('id="member-form"');
    expect(editing).toContain("Save your details");
    expect(editing).toContain("Cancel");
    expect(editing).not.toContain("Edit your details");
  });

  it("offers to add details without opening the form when you are not in the household yet", () => {
    family.current = sampleFamily(createInitialState().members.map((member) => ({ ...member, linkedUserId: null })));

    const you = renderAt("/me");
    expect(you).toContain("not in this household yet");
    expect(you).toContain('href="/me?edit=1"');
    expect(you).not.toContain('id="member-form"');

    const directory = renderAt("/directory");
    expect(directory).toContain('href="/me?edit=1"');
    expect(directory).toContain("Add your details");
  });
});

function renderAt(path: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

function primaryNav(html: string): string {
  const nav = html.match(/<nav\b[^>]*aria-label="Primary"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  if (!nav) throw new Error("Primary navigation is missing.");
  return nav;
}

function tabLabels(nav: string): string[] {
  return [...nav.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((match) => (match[1] ?? "").trim());
}

function currentTab(nav: string): string {
  const match = nav.match(/<a\b(?=[^>]*aria-current="page")[^>]*>([^<]+)<\/a>/);
  const label = match?.[1]?.trim();
  if (!label) throw new Error("No tab is marked as the current page.");
  return label;
}

function sampleFamily(members?: readonly Member[]): FamilyContextValue {
  const state = createInitialState();
  const currentUser = state.people.find((person) => person.id === state.currentUserId);
  const roster = members ? [...members] : state.members;
  const saved = roster[0];
  if (!currentUser || !saved) throw new Error("The sample household is incomplete.");
  return {
    group: state.group,
    people: state.people,
    currentUser,
    members: roster,
    relations: state.relations,
    godparents: state.godparents,
    getMember: (id) => roster.find((member) => member.id === id),
    addMember: async () => saved,
    importMembers: async () => [],
    addSampleHousehold: async () => undefined,
    updateMember: async () => undefined,
    saveOwnDetails: async () => saved,
    removeMember: async () => undefined,
    signOut: async () => undefined,
  };
}
