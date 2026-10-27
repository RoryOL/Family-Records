import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FamilyLinksField } from "./FamilyLinksField";
import { GodparentsField } from "./GodparentsField";

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
    expect(html).toContain("married to");
    expect(html).toContain("Marriage date");
    expect(html).toContain('value="2014-09-23"');
    expect(html.match(/type="date"/g)).toHaveLength(1);
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
