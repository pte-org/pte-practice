import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";

vi.mock("@/common/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("ChangePasswordForm", () => {
  it("lets the student reveal both new-password fields", () => {
    const html = renderToStaticMarkup(
      <ChangePasswordForm currentPassword="temp" onChanged={() => undefined} onCancel={() => undefined} />,
    );
    expect(html.match(/class="password-toggle"/g)).toHaveLength(2);
    expect(html.match(/aria-label="auth.showPassword"/g)).toHaveLength(2);
    expect(html.match(/type="password"/g)).toHaveLength(2);
  });
});
