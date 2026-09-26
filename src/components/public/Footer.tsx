import Link from "next/link";
import { Cake, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cake className="w-5 h-5 text-amber-400" />
              <span className="font-serif text-lg font-bold text-white tracking-wide">
                Wasana Bakers
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-4">
              Handcrafting delightful cakes and baked treats for celebrations across Kandy, Sri Lanka.
            </p>
            <p className="text-xs text-stone-500">
              © {new Date().getFullYear()} Wasana Bakers. All rights reserved.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-400 tracking-wider uppercase mb-3">
              Contact & Location
            </h3>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Kandy Main Street & Katugastota Branches, Kandy, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>+94 81 223 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Daily: 7:00 AM – 8:00 PM</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-amber-400 tracking-wider uppercase mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link href="/cakes" className="hover:text-amber-300 transition-colors">
                  Our Cakes Catalogue
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-300 transition-colors">
                  Staff Admin Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
