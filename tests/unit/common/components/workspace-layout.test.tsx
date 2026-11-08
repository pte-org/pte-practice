import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkspaceLayout } from "@/common/components/WorkspaceLayout";

describe("shared workspace slots", () => {
  it.each(["tasks", "mock-tests", "study-pack", "progress"])("changes only route content for %s", (page) => {
    const html = renderToStaticMarkup(<WorkspaceLayout header={<header>shared header</header>}
      sidebar={<aside>shared sidebar</aside>} beforeContent={<section>resume sessions</section>}>
      <section data-page={page}>{page}</section>
    </WorkspaceLayout>);
    expect(html.match(/<header>/g)).toHaveLength(1);
    expect(html.match(/<aside>/g)).toHaveLength(1);
    expect(html).toContain(`data-page="${page}"`);
    expect(html.indexOf("shared header")).toBeLessThan(html.indexOf("resume sessions"));
    expect(html.indexOf("resume sessions")).toBeLessThan(html.indexOf(`data-page="${page}"`));
    expect(html).toContain('class="workspace-layout-content"');
  });
});
