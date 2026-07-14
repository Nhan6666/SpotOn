import { Ticket, Clock } from 'lucide-react';
import { PUBLIC_TEXTS } from '@/constants/texts/public';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { PublicVoucherCard } from '@/components/ui/PublicVoucherCard';

export function BranchVouchersTab({ branch }: any) {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  const { success } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('spoton_claimed_vouchers');
      if (saved) {
        setClaimedOffers(new Set(JSON.parse(saved)));
      }
    } catch (e) {}
  }, []);

  const handleSimulateClaim = (code: string) => {
    if (code) {
      navigator.clipboard.writeText(code);
      setClaimedOffers(prev => {
        const next = new Set(prev).add(code);
        localStorage.setItem('spoton_claimed_vouchers', JSON.stringify(Array.from(next)));
        return next;
      });
      success(`Đã nhận thành công! Voucher ${code} đã nằm trong Ví ưu đãi của bạn.`);
    }
  };

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // Mocked or external fetch logic here
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch vouchers:', err);
        setIsLoading(false);
      }
    };
    if (branch?._id) {
      fetchVouchers();
    }
  }, [branch?._id]);

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-100 mt-6">
        <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <Ticket className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{PUBLIC_TEXTS.branchDetail.vouchersTab.emptyTitle}</h3>
        <p className="text-gray-500">{PUBLIC_TEXTS.branchDetail.vouchersTab.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{PUBLIC_TEXTS.branchDetail.vouchersTab.title}</h3>
        <p className="text-sm text-gray-500">{PUBLIC_TEXTS.branchDetail.vouchersTab.subtitle}</p>
      </div>

      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto gap-6 pb-4 hide-scrollbar cursor-grab active:cursor-grabbing ${!isDragging ? 'snap-x snap-mandatory' : ''}`} 
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        {vouchers.map((voucher, idx) => {
          const isClaimed = claimedOffers.has(voucher.code);
          return (
            <PublicVoucherCard
                key={voucher._id || idx}
                voucher={voucher}
                isClaimed={isClaimed}
                onClaim={handleSimulateClaim}
                className="min-w-[300px] md:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start"
            />
          );
        })}
      </div>
    </div>
  );
}
