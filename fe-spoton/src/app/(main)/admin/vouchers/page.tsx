import VouchersFeature from '@/features/admin/vouchers/VouchersFeature';

export const metadata = {
  title: 'Quản lý Voucher | SpotOn Admin',
};

export default function VouchersPage() {
  return (
    <div className="p-6">
      <VouchersFeature />
    </div>
  );
}
