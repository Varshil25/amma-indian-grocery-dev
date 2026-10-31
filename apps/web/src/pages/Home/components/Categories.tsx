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
import SectionHeading from "../../../components/SectionHeading";

// Alternating card colours for admin-managed promo banners
const promoStyles = [{ bgColor: "#F7F7F7" }, { bgColor: "#F8C41A" }];

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
    <section className="w-full section-padding bg-white">

      <SectionHeading eyebrow="Categories" title="Featured" highlight="Categories" className="px-4 mb-8 md:mb-10" />

      {/* Swiper Wrapper: arrows sit outside the slides from tablet up; phones swipe */}
      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-14">

        <button
          type="button"
          aria-label="Previous categories"
          className="swiper-prev absolute left-2 top-[40%] -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full hidden md:flex items-center justify-center hover:bg-green-500 hover:text-white transition"
        >
          <HiChevronLeft className="text-xl" />
        </button>
        <button
          type="button"
          aria-label="Next categories"
          className="swiper-next absolute right-2 top-[40%] -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full hidden md:flex items-center justify-center hover:bg-green-500 hover:text-white transition"
        >
          <HiChevronRight className="text-xl" />
        </button>

        {loading && (
          <div className="flex gap-4 md:gap-6 justify-center overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[110px] h-[110px] md:w-[150px] md:h-[150px] lg:w-[170px] lg:h-[170px] rounded-full bg-background-secondary animate-pulse" />
            ))}
          </div>
        )}
        {!loading && categories.length === 0 && (
          <p className="text-center text-body-md text-text-300">Categories are coming soon.</p>
        )}
        {categories.length > 0 && (
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          }}
          autoplay={{ delay: 3000, disableOnInteraction: true, pauseOnMouseEnter: true }}
          loop={categories.length > 6}
          breakpoints={{
            0: { slidesPerView: 2.6, spaceBetween: 12 },
            480: { slidesPerView: 3.4, spaceBetween: 16 },
            768: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 24 },
            1280: { slidesPerView: 6, spaceBetween: 28 },
          }}
          className="!pb-2"
        >
          {categories.map((cat, index) => (
            <SwiperSlide key={cat.slug || index}>
              <Link to={`/categories/${cat.slug}`} className="flex flex-col items-center cursor-pointer group">

                {/* Category circle: fills the slide, never wider than 170px */}
                <div className="w-full max-w-[170px] aspect-square rounded-full bg-background-secondary flex items-center justify-center overflow-hidden group-hover:bg-green-100 transition shadow-sm">
                  <img src={cat.img} alt="" className="w-1/2 h-1/2 object-contain" />
                </div>

                <div className="text-center mt-3">
                  <p className="text-body-sm sm:text-smtitle font-medium text-text-500 group-hover:text-green-600 transition line-clamp-2">{cat.name}</p>
                  <span className="text-body-xs sm:text-body-sm text-text-300">{cat.count} {cat.count === 1 ? "Item" : "Items"}</span>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        )}
      </div>

      {/* Promo cards — managed in Admin → Banners; hidden when there are none */}
      {promoCards.length > 0 && (
      <div className={`container mx-auto px-4 sm:px-6 grid grid-cols-1 ${promoCards.length > 1 ? "lg:grid-cols-2" : ""} gap-4 md:gap-6 lg:gap-8 mt-8 md:mt-12`}>

        {promoCards.map((banner, index) => {
          const style = promoStyles[index % promoStyles.length];
          const link = banner.link || "/all-categories";
          const external = /^https?:\/\//.test(link);
          // Photo on top on a phone; text on the left and the photo filling the right side from 640px up
          const className =
            "group relative w-full overflow-hidden rounded-2xl grid sm:grid-cols-[minmax(0,1fr)_minmax(0,40%)] sm:min-h-[240px] lg:min-h-[280px]";
          const content = (
            <>
              <div className="order-last sm:order-first flex flex-col justify-center items-start gap-3 p-5 sm:p-8">
                <h3 className="text-h6 font-semibold text-text-500">{banner.title}</h3>
                {banner.subtitle && <p className="text-body-sm sm:text-body-md text-text-400">{banner.subtitle}</p>}
                <span className="mt-1 inline-flex items-center gap-2 bg-green-500 group-hover:bg-green-600 transition-colors text-white h-10 sm:h-12 px-5 sm:px-6 rounded-full text-body-sm sm:text-body-md font-medium">
                  Shop Now
                  <HiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
              <div className="relative aspect-[2/1] sm:aspect-auto">
                <img
                  src={banner.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                />
              </div>
            </>
          );
          return external ? (
            <a key={banner.id} href={link} target="_blank" rel="noopener noreferrer" className={className} style={{ background: style.bgColor }}>
              {content}
            </a>
          ) : (
            <Link key={banner.id} to={link} className={className} style={{ background: style.bgColor }}>
              {content}
            </Link>
          );
        })}

      </div>
      )}

    </section>
  );
};

export default Categories;
