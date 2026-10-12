import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Member } from "../types";
import { MemberForm } from "./MemberForm";
import { emptyFormValues } from "./memberForm";
import { MemberProfile } from "./MemberProfile";

describe("Eircode lookup on a profile", () => {
  it("offers the post town under an Irish Eircode", () => {
    const html = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), postalCode: "A98 F4E2" }}
        suggestions={[]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(html).toContain("A98 F4E2 is in the Bray area, Co. Wicklow.");
    expect(html).toContain("Use Bray, Co. Wicklow");
    expect(html).toMatch(/aria-describedby="[^"]*postal-lookup"/);
  });

  it("confirms a town and county that already match, including a Co. prefix", () => {
    const html = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), postalCode: "A98 F4E2", city: "Bray", region: "Co. Wicklow" }}
        suggestions={[]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(html).toContain("Town and county match this Eircode.");
    expect(html).not.toContain("Use Bray");
  });

  it("lists each town when the routing key covers more than one", () => {
    const html = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), postalCode: "K36 AB12" }}
        suggestions={[]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(html).toContain("The characters after the routing key are not a valid Eircode.");
    expect(html).toContain("Use Malahide, Co. Dublin");
  });

  it("leaves an international postal code alone", () => {
    const html = renderToStaticMarkup(
      <MemberForm
        initial={{ ...emptyFormValues(), addressFormat: "international", postalCode: "A98 F4E2", country: "France" }}
        suggestions={[]}
        onSave={() => undefined}
        onDirtyChange={() => undefined}
      />,
    );
    expect(html).not.toContain("Bray");
    expect(html).toContain("Postal code");
  });

  it("shows the routing area under a saved address", () => {
    const html = renderToStaticMarkup(<MemberProfile member={aoife} people={[]} />);
    expect(html).toContain("D02 X285");
    expect(html).toContain("D02 X285 is in the Dublin 2 area, Co. Dublin.");
  });
});

const aoife: Member = {
  id: "mem_aoife",
  familyGroupId: "grp",
  firstName: "Aoife",
  lastName: "Murphy",
  fullName: "Aoife Murphy",
  relationship: "Cousin",
  dateOfBirth: null,
  phone: null,
  email: null,
  notes: "",
  linkedUserId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  address: {
    id: "adr_aoife",
    format: "ie",
    line1: "1 Abbey Street",
    line2: "",
    line3: "",
    city: "Dublin 2",
    region: "Dublin",
    postalCode: "D02 X285",
    country: "Ireland",
    verified: true,
  },
};
