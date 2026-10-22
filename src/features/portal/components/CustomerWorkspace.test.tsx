import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Theme } from "@radix-ui/themes";

const { command } = vi.hoisted(() => ({ command: vi.fn() }));
vi.mock("@/infrastructure/portal/use-portal", () => ({
  usePortal: () => ({
    command,
    refetch: vi.fn(),
    data: {
      user: { id: "customer", name: "Customer" },
      customerOrderIds: ["order"],
      orders: [
        {
          id: "order",
          seller_order_reference: "DEMO-ORDER",
          status: "IN_TRANSIT",
          provenance: "DEMO",
        },
      ],
      sellers: [],
      reports: [],
    },
  }),
  portalRequest: vi.fn(),
}));
vi.mock("./DeliveryUpdates", () => ({ DeliveryUpdates: () => null }));
vi.mock("./shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./shared")>()),
  PortalNav: () => null,
}));
import { CustomerWorkspace } from "./CustomerWorkspace";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("accepts a short customer description while keeping blank descriptions disabled", async () => {
  command.mockResolvedValue({ reportId: "short-report" });
  render(
    <Theme>
      <CustomerWorkspace />
    </Theme>,
  );
  fireEvent.click(screen.getByRole("button", { name: /DEMO-ORDER/ }));
  const description = screen.getByLabelText("Describe the issue");
  const submit = screen.getByRole("button", { name: "Submit report" });
  expect(description).not.toHaveAttribute("minlength");
  expect(description).toHaveAttribute("maxlength", "4000");
  expect(submit).toBeDisabled();
  fireEvent.change(description, { target: { value: "   " } });
  expect(submit).toBeDisabled();
  fireEvent.change(description, { target: { value: "Late" } });
  expect(submit).not.toBeDisabled();
  fireEvent.click(submit);
  await waitFor(() =>
    expect(command).toHaveBeenCalledWith("submit_report", {
      deliveryId: "order",
      description: "Late",
    }),
  );
  expect(await screen.findByText(/Report saved. Your status/)).toBeInTheDocument();
});
