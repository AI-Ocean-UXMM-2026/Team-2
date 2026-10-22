import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  maybeSingle: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ clear: mocks.clear }) }));
vi.mock("@/infrastructure/supabase/client", () => ({
  supabase: {
    auth: { signInWithPassword: mocks.signInWithPassword },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  },
}));
import { StaffPasswordLogin } from "./StaffPasswordLogin";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: "staff-id" } }, error: null });
});
afterEach(cleanup);

function submit() {
  render(<StaffPasswordLogin />);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "staff@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

it.each([
  ["OPERATIONS", "/overview"],
  ["DELIVERY_PERSON", "/driver"],
])("routes authenticated %s staff to their portal", async (role, destination) => {
  mocks.maybeSingle.mockResolvedValue({ data: { role, is_active: true }, error: null });
  submit();
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(destination));
  expect(mocks.clear).toHaveBeenCalled();
  expect(screen.getByLabelText("Password")).toHaveValue("");
});

it.each([null, { role: "OPERATIONS", is_active: false }, { role: "CUSTOMER", is_active: true }])(
  "does not route accounts without active staff access",
  async (member) => {
    mocks.maybeSingle.mockResolvedValue({ data: member, error: null });
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "no active operations or driver membership",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  },
);

it("shows invalid credentials without checking staff membership", async () => {
  mocks.signInWithPassword.mockResolvedValue({
    data: { user: null },
    error: new Error("Invalid login credentials"),
  });
  submit();
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid login credentials");
  expect(mocks.maybeSingle).not.toHaveBeenCalled();
  expect(mocks.replace).not.toHaveBeenCalled();
});
