import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { HiChevronLeft, HiChevronRight, HiArrowRight } from "react-icons/hi";
import { useCategories, useFeaturedCategories, type Category } from "../../../hooks/use-categories";

import veg from "../../../assets/Images/Homepage/Vegetable.png";
import fruit from "../../../assets/Images/Homepage/Fruit.png";
import dairy from "../../../assets/Images/Homepage/Dairy products.png";
import bakery from "../../../assets/Images/Homepage/bakery.png";
import cleaning from "../../../assets/Images/Homepage/house hold.png";
import dryfruits from "../../../assets/Images/Homepage/dry fruits.png";
import { useBanners } from "../../../hooks/use-content";

// Alternating card colours for admin-managed promo banners
const promoStyles = [
  { bgColor: "#F7F7F7", badgeColor: "#F8C41A" },
  { bgColor: "#F8C41A", badgeColor: "#FCE496" },
];

// Built-in icons for the starter categories, used until an image is uploaded in the admin
const categoryImageMap: Record<string, string> = {
  vegetables: veg,
  fruits: fruit,
  "fresh-fruits": fruit,
  "milk-eggs": dairy,
  dairy: dairy,
  bakery: bakery,
  "house-hold": cleaning,
  household: cleaning,
  cleaning: cleaning,
  "dry-fruits": dryfruits,
  spices: veg,
  "grains-rice": fruit,
  rice: fruit,
  lentils: veg,
  snacks: bakery,
};

function getCategoryImage(cat: Category): string {
  if (cat.image) return cat.image;
  const key = cat.slug.toLowerCase();
  return categoryImageMap[key] || veg;
}

const Categories = () => {
  const { data: featured, isLoading: featuredLoading } = useFeaturedCategories();
  const { data: all, isLoading: allLoading } = useCategories();
  const { data: banners } = useBanners("home_promo");

  // Categories starred in the admin; if none are starred, show all visible ones
  const source = featured && featured.length > 0 ? featured : all || [];
  const categories = source.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    img: getCategoryImage(cat),
    count: cat._count?.products ?? 0,
  }));
  const loading = featuredLoading || (allLoading && !(featured && featured.length));
  const promoCards = (banners || []).slice(0, 2);

  return (
    <section className="w-full py-16 bg-white select-none">

      {/* Titles */}
      <div className="text-center mb-10 px-4">
        <h3 className="text-body-lg text-text-300 tracking-wide">Categories</h3>
        <h2 className="text-h6 md:text-h3 font-semibold text-text-500">
          Featured <span className="text-green-500">Categories</span>
        </h2>
      </div>

      {/* Swiper Wrapper */}
      <div className="relative w-full max-w-[1400px] mx-auto px-8">

        {/* Prev Button */}
        <button
          className="swiper-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition"
        >
          <HiChevronLeft className="text-xl" />
        </button>

        {/* Next Button */}
        <button
          className="swiper-next absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition"
        >
          <HiChevronRight className="text-xl" />
        </button>

        {/* Swiper */}
        {loading && (
          <div className="flex gap-6 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[120px] h-[120px] md:w-[170px] md:h-[170px] rounded-full bg-background-secondary animate-pulse" />
            ))}
          </div>
        )}
        {!loading && categories.length === 0 && (
          <p className="text-center text-text-300">Categories are coming soon.</p>
        )}
        {categories.length > 0 && (
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          loop={categories.length > 6}
          breakpoints={{
            320: { slidesPerView: 2.3, spaceBetween: 16 },
            480: { slidesPerView: 3, spaceBetween: 18 },
            768: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 24 },
            1280: { slidesPerView: 6, spaceBetween: 28 },
          }}
          className="pb-6"
        >
          {categories.map((cat, index) => (
            <SwiperSlide key={cat.slug || index}>
              <Link to={`/categories/${cat.slug}`} className="flex flex-col items-center cursor-pointer group">

                {/* Category Circle */}
                <div className="w-[120px] h-[120px] md:w-[170px] md:h-[170px] rounded-full bg-background-secondary flex items-center justify-center group-hover:bg-green-100 transition shadow-sm">
                  <img src={cat.img} alt={cat.name} className="w-12 md:w-20" />
                </div>

                {/* Text */}
                <div className="text-center mt-4">
                  <p className="text-smtitle font-medium text-text-500 group-hover:text-green-600 transition">{cat.name}</p>
                  <span className="text-label text-text-300">{cat.count} {cat.count === 1 ? "Item" : "Items"}</span>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        )}
      </div>

      {/* Promo cards — managed in Admin → Banners; hidden when there are none */}
      {promoCards.length > 0 && (
      <div className={`container mx-auto px-3 md:px-6 grid grid-cols-1 ${promoCards.length > 1 ? "lg:grid-cols-2" : ""} gap-5 md:gap-10 mt-6 md:mt-10`}>

        {promoCards.map((banner, index) => {
          const style = promoStyles[index % promoStyles.length];
          const card = {
            badgeText: "",
            title: banner.title,
            subtitle: banner.subtitle || "",
            buttonText: "Shop Now",
            link: banner.link || "/all-categories",
            img: banner.image,
            ...style,
          };
          const external = /^https?:\/\//.test(card.link);
          const Wrapper = ({ children }: { children: React.ReactNode }) =>
            external ? (
              <a href={card.link} target="_blank" rel="noopener noreferrer" className="relative w-full min-h-[220px] md:min-h-[380px] rounded-xl md:rounded-2xl flex items-center justify-between gap-4 md:gap-8 p-4 md:p-12 overflow-hidden" style={{ background: card.bgColor }}>
                {children}
              </a>
            ) : (
              <Link to={card.link} className="relative w-full min-h-[220px] md:min-h-[380px] rounded-xl md:rounded-2xl flex items-center justify-between gap-4 md:gap-8 p-4 md:p-12 overflow-hidden" style={{ background: card.bgColor }}>
                {children}
              </Link>
            );
          return (
          <Wrapper key={banner.id}>
            {/* LEFT CONTENT */}
            <div className="flex flex-col gap-2 md:gap-4 max-w-[180px] md:max-w-[320px]">

              {/* Badge */}
              {card.badgeText && (
              <span
                className="px-3 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-label font-normal w-fit"
                style={{ background: card.badgeColor }}
              >
                {card.badgeText}
              </span>
              )}

              {/* Title */}
              <h3 className="text-base md:text-h4 lg:text-h3 font-medium text-text-500 leading-tight">
                {card.title}
              </h3>

              {/* Subtitle */}
              {card.subtitle && (
              <p className="text-xs md:text-caption text-text-400 leading-snug">
                {card.subtitle}
              </p>
              )}

              {/* CTA */}
              <span className="group flex items-center gap-2 md:gap-3 bg-green-500 hover:bg-green-600 transition-colors duration-200 text-white px-4 md:px-6 h-9 md:h-12 rounded-full text-sm md:text-base font-medium w-fit min-w-[100px] md:min-w-[160px]">
                {card.buttonText}
                <HiArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>

            {/* RIGHT IMAGE */}
            <div className="flex-1 flex justify-end items-end absolute right-0 bottom-0 top-2 md:top-5 h-full">
              <img
                src={card.img}
                alt={card.title}
                className="max-w-[160px] md:max-w-[380px] w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          </Wrapper>
          );
        })}

      </div>
      )}

    </section>
  );
};

export default Categories;
