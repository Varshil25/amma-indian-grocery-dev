import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { HiArrowRight } from "react-icons/hi";
import { Link } from "react-router-dom";
import { useActiveDeals, type ActiveDeal } from "../../../hooks/use-content";

// Decorative images around the live deal
import Img1 from "../../../assets/Images/Homepage/left-img-discount.png";
import Img2 from "../../../assets/Images/Homepage/middle-img-discount.png";
import Img3 from "../../../assets/Images/Homepage/right-side-discount.png";
import BasketImg from "../../../assets/Images/Homepage/fruit-basket-cta.png";

const dealHeadline = (d: ActiveDeal) =>
  d.discountType === "PERCENTAGE"
    ? `${d.discountValue}% off ${d.productCount === 1 ? "1 item" : `${d.productCount} items`}`
    : `$${d.discountValue.toFixed(2)} off ${d.productCount === 1 ? "1 item" : `${d.productCount} items`}`;

const endsOn = (d: ActiveDeal) =>
  `Ends ${new Date(d.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

const DealsSection = () => {
  const { data: deals } = useActiveDeals();
  // Feature the deal ending soonest (the API sorts by end date)
  const deal = deals && deals.length > 0 ? deals[0] : null;
  const [first, ...restWords] = (deal?.name || "").split(" ");

  return (
    <section className="w-full bg-white section-padding">

      {deal && (
      <>
      {/* ================= TOP DEALS GRID (DESKTOP) ================= */}
      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)_minmax(0,1fr)] gap-4 lg:gap-6 max-w-[1250px] mx-auto px-6">
        
        {/* LEFT CARD */}
        <div className="relative h-[460px] lg:h-[560px] xl:h-[640px] text-text-500 rounded-2xl lg:rounded-[30px] overflow-hidden">
          <img
            src={Img1}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* CENTER CARD WITH TEXT */}
        <div className="relative h-[460px] lg:h-[560px] xl:h-[640px] bg-background-secondary rounded-2xl lg:rounded-[30px] overflow-hidden flex items-center justify-center">
          <img
            src={Img2}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[430px]">
            <h2 className="text-h2 font-semibold text-text-500 w-full">
              {first} {restWords.length > 0 && <span className="text-green-500">{restWords.join(" ")}</span>}
            </h2>
            <p className="text-body-lg text-text-300 mt-3 w-full">
              {deal.description || dealHeadline(deal)}
            </p>
            <p className="text-body-sm text-text-200 mt-1 w-full">{deal.description ? `${dealHeadline(deal)} · ` : ""}{endsOn(deal)}</p>
            <div className="w-full flex justify-center">
              <Link to="/hot-deals" className="mt-6 lg:mt-8 group bg-green-500 text-white text-body-md font-medium px-7 h-12 lg:h-14 rounded-full flex items-center justify-center gap-3 hover:bg-green-700 transition">
                Shop Now{" "}
                <HiArrowRight className="group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="relative h-[460px] lg:h-[560px] xl:h-[640px] bg-green-500 rounded-2xl lg:rounded-[30px] overflow-hidden">
          <img
            src={Img3}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ================= MOBILE SLIDER ================= */}
      <div className="md:hidden px-4 overflow-hidden">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2000 }}
          slidesPerView={1.1}
          spaceBetween={12}
          loop
        >
          {/* the deal's own slide comes first so phones see the offer straight away */}
          {[Img2, Img1, Img3].map((img, i) => (
            <SwiperSlide key={i}>
              <div className="relative h-[340px] sm:h-[380px] rounded-2xl overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />

                {/* Only the first slide shows text */}
                {i === 0 && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex flex-col justify-center items-center text-center px-4">
                    <h2 className="text-h4 font-semibold text-text-500">
                      {first} {restWords.length > 0 && <span className="text-green-500">{restWords.join(" ")}</span>}
                    </h2>
                    <p className="text-body-sm text-text-500 mt-2">
                      {dealHeadline(deal)} · {endsOn(deal)}
                    </p>
                    <Link to="/hot-deals" className="mt-4 bg-green-600 text-white text-body-md font-medium px-6 h-11 rounded-full flex items-center gap-2">
                      Shop Now <HiArrowRight />
                    </Link>
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      </>
      )}

      {/* ================= BOTTOM CTA BANNER ================= */}
     {/* ================= RESPONSIVE CTA BANNER ================= */}
<div className={`container ${deal ? "mt-12 md:mt-20" : ""} px-4 sm:px-6 mx-auto`}>
  <div
    className="
    relative bg-green-500 rounded-2xl
      flex flex-col md:flex-row 
      items-center md:items-start
      justify-between overflow-hidden
      py-8 md:py-10 lg:py-14 px-6 md:px-12 lg:px-16
    "
  >
    {/* IMAGE (Mobile first) */}
    <img
      src={BasketImg}
      alt="Vegetable basket"
      className="
        w-[220px] sm:w-[280px] md:hidden 
        object-contain mb-6
      "
    />

    {/* TEXT */}
    <div className="z-20 text-center md:text-left max-w-[500px] md:max-w-[52%]">
      <h2 className="font-semibold text-h2 text-white">
        Purely Fresh Vegetables
      </h2>

      <p className="text-body-lg text-white mt-3">
        Freshness you can trust, Prices you’ll love
      </p>

      <Link
        to="/all-categories"
        className="
          mt-6 sm:mt-8 bg-yellow-500 text-text-500 
          px-6 sm:px-8 h-12 sm:h-14 rounded-full 
          flex items-center justify-center gap-3 w-fit
          text-body-md sm:text-body-lg font-medium hover:bg-yellow-300 transition
          mx-auto md:mx-0
        "
      >
        Shop Now <HiArrowRight className="text-lg sm:text-xl" />
      </Link>
    </div>

    {/* IMAGE (Desktop + Tablet absolute) */}
    <img
      src={BasketImg}
      alt=""
      className="
        hidden md:block absolute pointer-events-none select-none
        right-0 bottom-0 object-contain
      "
      style={{ width: "45%", maxWidth: "550px" }}
    />
  </div>
</div>

    </section>
  );
};

export default DealsSection;
