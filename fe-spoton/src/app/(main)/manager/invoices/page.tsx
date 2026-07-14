import { InvoicesFeature } from "@/features/manager/invoices/InvoicesFeature";

export const metadata = {
  title: "Đối soát hóa đơn | Manager",
  description: "Lịch sử Checkout và các đơn chờ đối soát",
};

export default function InvoicesPage() {
  return <InvoicesFeature />;
}
