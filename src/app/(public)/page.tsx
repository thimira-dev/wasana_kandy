import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cake, Sparkles, MapPin, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-stone-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-amber-50/70 to-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Kandy&apos;s Finest Handcrafted Celebration Cakes</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                Celebrate sweet moments with <span className="text-amber-700">Wasana Bakers</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
                Freshly baked every morning in the hill capital of Kandy. Customise your favorite flavours,
                colours, weights, and personalized greetings online with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  href="/cakes"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-amber-200 cursor-pointer"
                >
                  <Cake className="w-5 h-5" />
                  <span>Explore Cake Catalogue</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200/80 text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kandy, Sri Lanka</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Fresh Daily Bakes</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-4/3 sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100">
                <Image
                  src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1000&auto=format&fit=crop&q=80"
                  alt="Wasana Bakers Special Celebration Cake"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
