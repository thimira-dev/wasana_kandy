import { OrderService } from "@/lib/services/order-service";
import { CustomerProgressBar } from "@/components/public/CustomerProgressBar";
import { CheckoutReviewView } from "@/components/public/CheckoutReviewView";

export const revalidate = 0;

export const metadata = {
  title: "Review Your Order | Wasana Bakers Checkout",
};

export default async function CheckoutReviewPage() {
  const branches = await OrderService.getActiveBranches();

  const formattedBranches = branches.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    address: b.address,
    phone: b.phone,
  }));

  return (
    <div className="bg-stone-50 min-h-screen pb-20">
      {/* Progress Bar (Step 2 Active) */}
      <div className="bg-white border-b border-stone-200">
        <CustomerProgressBar currentStep={2} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <CheckoutReviewView branches={formattedBranches} />
      </div>
    </div>
  );
}
