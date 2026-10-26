import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../data/mockFamily";
import type { Member } from "../types";
import { MemberCard } from "./MemberCard";
import { MemberForm } from "./MemberForm";
import { emptyFormValues } from "./memberForm";
import { MemberProfile } from "./MemberProfile";

describe("deceased member views", () => {
  it("asks for a date of death only after someone is flagged deceased", () => {
    const living = renderToStaticMarkup(
      <MemberForm initial={emptyFormValues()} suggestions={[]} onSave={() => undefined} onDirtyChange={() => undefined} />,
    );
    expect(living).toContain("Deceased");
    expect(living).toContain("Birthdays and greeting cards leave this person out.");
    expect(living).not.toContain("Date of death");

    const remembered = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), firstName: "Arthur", deceased: true, dateOfBirth: "1956-12-18", dateOfDeath: "2019-03-02" }}
        suggestions={[]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(remembered).toContain("Date of death");
    expect(remembered).toContain("2019-03-02");
    expect(remembered).toContain("Died at 62");
    expect(remembered).not.toContain("Turns");
  });

  it("shows the death on a profile and a directory card instead of the next birthday", () => {
    const arthur = rememberedArthur();
    const profile = renderToStaticMarkup(<MemberProfile member={arthur} people={[]} />);
    expect(profile).toContain("Deceased");
    expect(profile).toContain("Date of death");
    expect(profile).toContain("Mar 2, 2019");
    expect(profile).toContain("Died at 62");
    expect(profile).not.toContain("Next birthday");

    const card = renderToStaticMarkup(
      <MemoryRouter>
        <MemberCard member={arthur} to="/members/mem_arthur" />
      </MemoryRouter>,
    );
    expect(card).toContain("Deceased");
    expect(card).toContain("Died Mar 2, 2019 at 62");
    expect(card).not.toContain("Turns");
  });
});

function rememberedArthur(): Member {
  const arthur = createInitialState().members.find((member) => member.id === "mem_arthur");
  if (!arthur) throw new Error("Arthur is missing from the sample household.");
  return { ...arthur, deceased: true, dateOfDeath: "2019-03-02" };
}
