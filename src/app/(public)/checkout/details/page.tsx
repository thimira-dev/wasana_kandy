import { OrderService } from "@/lib/services/order-service";
import { CustomerProgressBar } from "@/components/public/CustomerProgressBar";
import { CheckoutDetailsView } from "@/components/public/CheckoutDetailsView";

export const revalidate = 0;

export const metadata = {
  title: "Customer & Pickup Details | Wasana Bakers Checkout",
};

export default async function CheckoutDetailsPage() {
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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Customer & Pickup Information
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Provide your contact details and select your preferred pickup branch and ready date.
          </p>
        </div>

        <CheckoutDetailsView branches={formattedBranches} />
      </div>
    </div>
  );
}
