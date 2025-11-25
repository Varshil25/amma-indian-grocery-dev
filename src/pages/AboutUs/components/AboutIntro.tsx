import React from "react";
import { HiCheckCircle } from "react-icons/hi2";

import AboutImg from "../../../assets/Images/Aboutus/aboutus.png"; // replace with actual path

const points = [
  "Eco-friendly and daily grocery products at one place",
  "Farm fresh produce and trusted quality brands",
  "Fast delivery with satisfaction assurance",
];

const AboutIntro = () => {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        
        {/* ============ LEFT IMAGE ============ */}
        <div className="relative w-full h-[420px] md:h-[520px] rounded-2xl overflow-hidden">
          {/* Image */}
          <img
            src={AboutImg}
            alt="About Us"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ============ RIGHT CONTENT ============ */}
        <div className="max-w-[600px] space-y-6">
          {/* Sub Label */}
          <span className="text-body-lg text-text-300 block">About Us</span>

          {/* Title */}
          <h2 className="text-h5 md:text-h2 font-semibold text-text-500 leading-tight">
            Your One Step Stop for <span className="text-green-500">Quality Groceries</span> 
          </h2>

          {/* Description */}
          <p className="text-body-lg text-text-300 leading-relaxed max-w-[550px]">
            Freshness you can trust, prices you’ll love, everything you need, 
            all in one place. Wholesome food your family can rely on every 
            single day.
          </p>

          {/* Bullet Points */}
          <div className="space-y-3 mt-4">
            {points.map((item, index) => (
              <div key={index} className="flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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

            <p className="text-4xl text-text-500" style={{ fontFamily: "'Alex Brush', cursive" }}>
              Amma Grocery
            </p>
            <p className="text-body-lg text-text-400 -mt-1">Jordan — Founder</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutIntro;
