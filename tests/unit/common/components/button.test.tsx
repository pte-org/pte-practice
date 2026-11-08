import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "@/common/components/Button";

describe("common Button", () => {
  it("uses primary fill by default without implicitly submitting a form", () => {
    const html = renderToStaticMarkup(<Button>Continue</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('data-variant="primary"');
    expect(html).toContain('data-appearance="fill"');
    expect(html).not.toContain("disabled");
  });

  it("keeps secondary outline as the web default and permits a tinted fill", () => {
    expect(renderToStaticMarkup(<Button variant="secondary">Back</Button>)).toContain('data-appearance="outline"');
    expect(renderToStaticMarkup(<Button variant="secondary" appearance="fill">New set</Button>)).toContain('data-appearance="fill"');
  });

  it("disables pending actions and replaces icons with a non-announced spinner and loading text", () => {
    const html = renderToStaticMarkup(<Button isPending loadingText="Saving" leftIcon={<i>left icon</i>} rightIcon={<i>right icon</i>}>Save</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Saving");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("left icon");
    expect(html).not.toContain("right icon");
  });

  it("preserves submit, disabled and accessible labels supplied by the caller", () => {
    const html = renderToStaticMarkup(<Button type="submit" disabled aria-label="Submit response">Submit</Button>);
    expect(html).toContain('type="submit"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Submit response"');
  });
});
