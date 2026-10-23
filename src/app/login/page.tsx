import { CustomerAccountForm } from "@/features/customer-auth/components/CustomerAccountForm";
import { Notice, ProductMark, SiteShell } from "@/shared/ui/patterns";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <SiteShell width="sm" brand={<ProductMark />}>
      <div className="space-y-6 py-4">
        {params.error && (
          <Notice tone="error" role="alert">
            Google sign-in was cancelled or could not be completed. Try again.
          </Notice>
        )}
        <CustomerAccountForm />
      </div>
    </SiteShell>
  );
}
