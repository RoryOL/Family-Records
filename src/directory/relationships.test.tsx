import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FamilyLinksField } from "./FamilyLinksField";
import { GodparentsField } from "./GodparentsField";
import { MemberForm } from "./MemberForm";
import { emptyFormValues } from "./memberForm";

describe("relationship fields", () => {
  const people = [
    { id: "older", fullName: "Older Person", dateOfBirth: "1950-01-01" },
    { id: "younger", fullName: "Younger Person", dateOfBirth: "2015-06-01" },
    { id: "unknown", fullName: "Unknown Age", dateOfBirth: null },
  ];

  it("keeps partner and shows a marriage date only for married", () => {
    const html = renderToStaticMarkup(
      <FamilyLinksField
        links={[
          { otherId: "older", role: "spouse" },
          { otherId: "unknown", role: "married", weddingDate: "2014-09-23" },
        ]}
        people={people}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain("the partner of");
    expect(html).toContain("the step-parent of");
    expect(html).toContain("the step-child of");
    expect(html).toContain("married to");
    expect(html).toContain("the partner or spouse of a parent is a mother or father");
    expect(html).toContain("Marriage date");
    expect(html).toContain('value="23/09/2014"');
    expect(html).toContain('placeholder="dd/mm/yyyy"');
    expect(html).toContain('aria-label="Open calendar for Marriage date 2"');
    expect(html.match(/type="date"/g)).toHaveLength(1);
  });

  it("lists the signed-in person first in the relationship dropdown", () => {
    const html = renderToStaticMarkup(
      <FamilyLinksField
        links={[{ otherId: "", role: "child" }]}
        people={[
          { id: "zara", fullName: "Zara Adams" },
          { id: "me", fullName: "Mina Byrne" },
          { id: "aaron", fullName: "Aaron Byrne" },
        ]}
        focusId="me"
        onChange={() => undefined}
      />,
    );
    const related = html.match(/aria-label="Related person 1"[\s\S]*?<\/select>/)?.[0] ?? "";
    const names = [...related.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((match) => match[1]);
    expect(names).toEqual(["Choose a person", "Mina Byrne (you)", "Aaron Byrne", "Zara Adams"]);
  });

  it("offers the family surname first when adding someone, and hides those choices while editing", () => {
    const adding = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), links: [{ otherId: "", role: "child" }] }}
        suggestions={[]}
        familyName="Harper"
        surnames={["Harper", "Ellison"]}
        people={[
          { id: "me", fullName: "Elena Harper" },
          { id: "ruth", fullName: "Ruth Ellison" },
        ]}
        focusId="me"
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(adding).toContain("Choose a surname");
    expect(adding).toContain("Harper");
    expect(adding).toContain("· yours");
    expect(adding.indexOf("Harper")).toBeLessThan(adding.indexOf("Ellison"));
    expect(adding).toContain("Elena Harper (you)");

    const editing = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), firstName: "Jonah", lastName: "Harper" }}
        selfId="jonah"
        suggestions={[]}
        familyName="Harper"
        surnames={["Harper", "Ellison"]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(editing).not.toContain("Choose a surname");
    expect(editing).not.toContain("· yours");
  });

  it("leaves a younger person out of the godparent list", () => {
    const html = renderToStaticMarkup(
      <GodparentsField
        slots={[
          { choice: "", name: "" },
          { choice: "", name: "" },
        ]}
        people={people}
        subjectDateOfBirth="2000-01-01"
        onChange={() => undefined}
      />,
    );
    expect(html).toContain("Older Person");
    expect(html).toContain("Unknown Age");
    expect(html).toContain("Someone not listed");
    expect(html).toContain("Someone younger than this person is left off the list.");
    expect(html).not.toContain("Younger Person");
  });

  it("lists everyone when this person has no birth date", () => {
    const html = renderToStaticMarkup(
      <GodparentsField
        slots={[
          { choice: "", name: "" },
          { choice: "younger", name: "" },
        ]}
        people={people}
        subjectDateOfBirth=""
        onChange={() => undefined}
      />,
    );
    expect(html).toContain("Younger Person");
    expect(html).not.toContain("left off the list");
  });
});
