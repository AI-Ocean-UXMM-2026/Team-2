import { StaffPasswordLogin } from "@/features/portal/components/StaffPasswordLogin";

export const metadata = { title: "Staff sign-in", robots: { index: false } };

export default function StaffLoginPage() {
  return <StaffPasswordLogin />;
}
