"use client";

import { Facebook, Instagram, Twitter, ChevronDown, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Footer() {

  const sections = [
    {
      id: 'about',
      title: 'MORE ABOUT LEVIS INDIA STORE',
      content: 'Discover the world of Levi\'s, a brand synonymous with quality denim and timeless style since 1873. From iconic jeans to comfortable casual wear, Levi\'s India offers premium products for every lifestyle.'
    },
    {
      id: 'quick',
      title: 'QUICK LINKS',
      links: ["Men's Jeans", "Women's Jeans", "Men's T-Shirts", "Women's Tops", "Belts & Wallets", "Footwear", "Men's Jackets", "Red Tab Member Program", "Store Locator"]
    },
    {
      id: 'support',
      title: 'SUPPORT',
      links: ["Help", "Returns & Exchanges", "Shipping", "About Us"]
    },
    {
      id: 'contact',
      title: 'CONTACT',
      contactItems: [
        { label: 'For Customer care', value: 'customercare@levi.in', type: 'email' },
        { label: 'For Order Escalation', value: 'feedbacklevi@levi.in', type: 'email' },
        { label: 'For Online Orders', value: '1800-123-584', type: 'phone' },
        { label: 'For Store Queries', value: '1800-1020-501', type: 'phone' },
        { label: 'Call Timings', value: 'Mon-Sat : 10AM - 6PM', type: 'text' }
      ]
    },
    {
      id: 'company',
      title: 'COMPANY',
      links: ["About Us", "Careers", "Press", "Blog"]
    },
    {
      id: 'perks',
      title: 'ITS ALL ABOUT THE PERKS',
      isPerks: true
    }
  ];

  return (
    <footer className="bg-gray-100">

      {/* Mobile and Tablet Footer */}
      <div className="md:hidden px-4 py-6 space-y-0">
        {/* Collapsible sections for mobile */}
        {sections.map((section) => (
          <details key={section.id} className="group border-b border-gray-200">
            <summary className="flex items-center justify-between cursor-pointer py-4 select-none">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">{section.title}</h3>
              <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pb-4 space-y-3">
              {section.isPerks ? (
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full px-0 py-2 border-b border-gray-300 text-sm bg-transparent outline-none placeholder-gray-400 focus:border-gray-900"
                  />
                  <Button className="w-full bg-gray-900 text-white hover:bg-black text-sm py-3">
                    Subscribe
                  </Button>
                  <p className="text-xs text-gray-600">
                    *See <Link href="#" className="underline">Details</Link> on Terms and Conditions and <Link href="#" className="underline">Privacy Policy</Link> for our privacy practices.
                  </p>
                </div>
              ) : section.contactItems ? (
                <div className="space-y-3">
                  {section.contactItems.map((item, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-bold text-gray-900 mb-1">{item.label}</p>
                      <Link href={item.type === 'email' ? `mailto:${item.value}` : `tel:${item.value}`} className="text-xs text-gray-600">
                        {item.value}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : section.content ? (
                <p className="text-xs text-gray-600 leading-relaxed">{section.content}</p>
              ) : (
                <ul className="space-y-2">
                  {section.links?.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-xs text-gray-600">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        ))}

        {/* Copyright and socials for mobile */}
        <div className="pt-6 space-y-4 text-center">
          <p className="text-xs text-gray-600">© 2025, Levis India Store</p>
          <div className="flex gap-4 justify-center">
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Facebook className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Instagram className="w-4 h-4" />
            </Link>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition">
              <Twitter className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop and Tablet Footer (md+) */}
      <div className="hidden md:block max-w-7xl mx-auto md:py-2 md:px-4">
        <details className="group border-b border-gray-200 pb-1">
          <summary className="flex items-center justify-between cursor-pointer py-4 select-none">
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">More About Levi&rsquo;s India Store</h3>
            <ChevronDown className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform" />
          </summary>
          <p className="text-gray-600 text-sm leading-relaxed pb-4">
            Discover the world of Levi&rsquo;s, a brand synonymous with quality denim and timeless style since 1873. From iconic jeans to comfortable casual wear, Levi&rsquo;s India offers premium products for every lifestyle.
          </p>
        </details>

        <div className="">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto md:py-4 border-b border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Quick Links Section */}
          <div>
            <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-1">
              {['Men\'s Jeans', 'Women\'s Jeans', 'Men\'s T-shirts', 'Women\'s Tops', 'Belts & Wallets', 'Footwear', 'Men\'s Jackets', 'Red Tab Member Program', 'Store Locator'].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Support
            </h3>
            <ul className="space-y-1">
              {[
                { label: 'Help', href: '#' },
                { label: 'Returns & Exchanges', href: '#' },
                { label: 'Shipping', href: '#' },
                { label: 'About Us', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">
              Contact
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-black -mb-1">For Customer Care</p>
                <a href="mailto:customercare@levi.in" className="text-sm text-gray-600 hover:text-black transition-colors">
                  customercare@levi.in
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold text-black -mb-1">For Order Escalation</p>
                <a href="mailto:feedbacklevi@levi.in" className="text-sm text-gray-600 hover:text-black transition-colors">
                  feedbacklevi@levi.in
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold text-black -mb-1">For Online Orders</p>
                <a href="tel:1800-123-5384" className="text-sm text-gray-600 hover:text-black transition-colors">
                  1800-123-5384
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold text-black -mb-1">For Store Queries</p>
                <a href="tel:1800-1020-501" className="text-sm text-gray-600 hover:text-black transition-colors">
                  1800-1020-501
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold text-black -mb-1">Call Timings</p>
                <p className="text-sm text-gray-600">Mon-Sat: 10AM - 6PM</p>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="text-sm font-bold text-black mb-2 uppercase tracking-wide">
              It&apos;s All About The Perks
            </h3>
            <form className="lg:space-y-4 md:space-y-2">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-0 py-2 bg-transparent border-b border-gray-400 text-sm focus:outline-none focus:border-black transition-colors"
              />
              <p className="text-xs text-gray-600">
                *See <a href="#" className="underline hover:text-black">Details</a> for Terms and Conditions and See <a href="#" className="underline hover:text-black">Privacy Policy</a> for our privacy practices.
              </p>
              <button
                type="submit"
                className="w-full bg-black text-white py-3 text-sm font-semibold hover:bg-gray-900 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto lg:py-2 md:pb-14 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 text-center md:text-left">
            <p>
              © 2025, Levi&apos;s India Store
              {' '}
              <a href="#" className="hover:text-black underline mx-2">Privacy Policy</a>
              <a href="#" className="hover:text-black underline mx-2">Terms of use</a>
              <a href="#" className="hover:text-black underline mx-2">Returns</a>
              <a href="#" className="hover:text-black underline mx-2">Corporate Information</a>
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="flex gap-4">
            <a
              href="#"
              className="text-gray-600 hover:text-black transition-colors"
              aria-label="Pinterest"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" />
              </svg>
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-black transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-black transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-black transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
      </div>

    </footer>
  );
}
