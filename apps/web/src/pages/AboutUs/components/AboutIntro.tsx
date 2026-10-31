import React from "react";
import SectionHeading from "../../../components/SectionHeading";

import AboutImg from "../../../assets/Images/Aboutus/aboutus.png"; // replace with actual path

const points = [
  "Eco-friendly and daily grocery products at one place",
  "Farm fresh produce and trusted quality brands",
  "Fast delivery with satisfaction assurance",
];

const AboutIntro = () => {
  return (
    <section className="w-full bg-white section-padding">
      <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-14 items-center">
        
        {/* ============ LEFT IMAGE ============ */}
        <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[520px] rounded-2xl overflow-hidden">
          {/* Image */}
          <img
            src={AboutImg}
            alt="About Us"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ============ RIGHT CONTENT ============ */}
        <div className="max-w-[600px] space-y-5 md:space-y-6">
          <SectionHeading eyebrow="About Us" title="Your One Stop for" highlight="Quality Groceries" align="left" />

          {/* Description */}
          <p className="text-body-lg text-text-300 max-w-[550px]">
            Freshness you can trust, prices you’ll love, everything you need, 
            all in one place. Wholesome food your family can rely on every 
            single day.
          </p>

          {/* Bullet Points */}
          <div className="space-y-3 mt-4">
            {points.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="w-6 h-6 mt-0.5 shrink-0 rounded-full bg-yellow-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-body-md text-text-500">{item}</p>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div className="pt-6">
            {/* Import Alex Brush font via Google Fonts */}
            <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" rel="stylesheet" />

            <p className="text-3xl sm:text-4xl text-text-500" style={{ fontFamily: "'Alex Brush', cursive" }}>
              Amma Grocery
            </p>
            <p className="text-body-md text-text-400 mt-1">Jordan — Founder</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutIntro;
