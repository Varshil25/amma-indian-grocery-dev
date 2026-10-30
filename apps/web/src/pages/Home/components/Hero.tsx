import heroImage from "../../../assets/Images/Homepage/model.png";
import bgTexture from "../../../assets/Images/Homepage/hero_backrground.png";
import { HiArrowRight } from "react-icons/hi";
import { HiShoppingBag } from "react-icons/hi2";
import { FaLeaf } from "react-icons/fa";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section
      className="w-full max-h-full bg-background-secondary overflow-hidden mt-16 lg:mt-0"
      style={{
        backgroundImage: `url(${bgTexture})`,
        backgroundPosition: "center",
      }}
    >
      <div className="container mx-auto px-4 md:px-8 pt-12 flex flex-col lg:flex-row items-center gap-10 md:gap-12 lg:gap-0 h-full">
        {/* LEFT CONTENT */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center max-w-full space-y-6 md:space-y-8 lg:pr-10 md:pr-8">

          {/* small badge */}
          <div className="bg-white rounded-full flex items-center gap-3 md:gap-4 px-3 md:px-5 py-2 shadow-sm w-fit">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-background-secondary rounded-full flex items-center justify-center shadow-inner">
              <HiShoppingBag className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm md:text-heading-5 text-text-500">The Best Online Grocery Store</p>
          </div>

          {/* MAIN TITLE */}
          <h1 className="text-[2.2rem] md:text-[2.8rem] lg:text-h1 font-semibold text-text-500 leading-tight">
            Your One Stop for <span className="text-green-500">Quality Groceries</span>
          </h1>

          {/* DESCRIPTION */}
          <p className="text-body-md md:text-body-lg text-text-300 max-w-md md:max-w-lg leading-snug">
            Freshness you can trust, prices you’ll love, everything you need all in one place.
            Wholesome food your family can rely on every single day.
          </p>

          {/* CTA BUTTON */}
          <Link to="/all-categories" className="group flex items-center gap-2 stroke-green-500 bg-green-500 text-white px-5 md:px-7 h-11 md:h-12 rounded-full text-base font-medium hover:bg-white hover:stroke-green-500 hover:text-green-500 transition-colors duration-200 shadow-md w-fit min-w-[120px] md:min-w-[140px] overflow-hidden relative focus:outline-none border-2 border-transparent hover:border-green-500">
            <span className="leading-tight">Shop Now</span>
            <span className="inline-flex items-center transition-transform duration-300 ease-out group-hover:translate-x-2">
              <HiArrowRight className="w-5 h-5" />
            </span>
          </Link>
        </div>

        {/* RIGHT IMAGE + BADGES */}
        <div className="relative w-full lg:w-1/2 flex justify-center items-center mt-0 lg:mt-0">

          {/* FLOATING BADGE 1 */}
          <div
            className="
              absolute 
              /* MOBILE & TABLET → move lower and center */
              top-[65%] left-1/2 -translate-x-1/2

              /* DESKTOP → original position */
              lg:top-[35%] lg:right-4 lg:left-auto lg:translate-x-0

              bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-xl 
              flex items-center gap-2 md:gap-3 floating z-[20]
            "
          >
            <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-green-500 flex items-center justify-center shadow-inner">
              <FaLeaf className="text-white text-base md:text-lg lg:text-xl" />
            </div>
            <span className="text-xs md:text-sm lg:text-label text-text-500">Everyday Fresh</span>
          </div>

          {/* FLOATING BADGE 2 */}
          <div
            className="
              absolute 
              /* MOBILE & TABLET → place bottom-left area */
              top-[78%] left-5

              /* DESKTOP → original */
              lg:top-1/2 lg:-left-10

              bg-white rounded-full px-3 md:px-4 py-1.5 md:py-2 shadow-xl 
              flex items-center gap-2 md:gap-3 floating z-[20] 
              delay-500
            "
          >
            <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-green-500 flex items-center justify-center shadow-inner">
              <HiShoppingBag className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="text-xs md:text-sm lg:text-label text-text-500">100% Organic</span>
          </div>

          {/* IMAGE */}
          <img
            src={heroImage}
            alt="Shopping Woman"
            className="w-56 md:w-80 lg:w-[32rem] drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)] pt-3 z-[5]"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
