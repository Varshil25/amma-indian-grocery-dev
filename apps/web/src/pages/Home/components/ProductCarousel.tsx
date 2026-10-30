import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

import type { ProductListItem } from "../../../hooks/use-products";
import { mapProductToCard } from "../../../lib/product-helpers";
import ProductCard from "../../ProductList/ProductCard";
import SectionHeading from "../../../components/SectionHeading";

interface Props {
  /** unique prefix for the swiper nav buttons */
  id: string;
  eyebrow: string;
  title: string;
  highlight: string;
  products: ProductListItem[] | undefined;
  isLoading: boolean;
  viewAllHref: string;
  background?: string;
}

/** Home page product carousel. Renders nothing when there are no real products to show. */
export default function ProductCarousel({ id, eyebrow, title, highlight, products, isLoading, viewAllHref, background = "bg-background-secondary" }: Props) {
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className={`w-full ${background} section-padding`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <SectionHeading eyebrow={eyebrow} title={title} highlight={highlight} align="left" className="min-w-0" />
          <Link
            to={viewAllHref}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 bg-green-500 text-white h-10 pl-4 pr-3 text-body-sm sm:text-body-md rounded-full hover:bg-green-700 transition"
          >
            View All <HiChevronRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <button className={`${id}-prev absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full items-center justify-center hover:bg-green-500 hover:text-white transition hidden md:flex`} type="button" aria-label="Previous products">
              <HiChevronLeft className="text-xl" />
            </button>
            <button className={`${id}-next absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white shadow-md w-10 h-10 rounded-full items-center justify-center hover:bg-green-500 hover:text-white transition hidden md:flex`} type="button" aria-label="Next products">
              <HiChevronRight className="text-xl" />
            </button>

            <Swiper
              modules={[Navigation, Autoplay]}
              autoplay={{ delay: 3500, disableOnInteraction: true, pauseOnMouseEnter: true }}
              navigation={{ nextEl: `.${id}-next`, prevEl: `.${id}-prev` }}
              // looping needs more slides than are visible
              loop={(products?.length ?? 0) > 4}
              // same card widths as the product grids: 2 on a phone (a little of the next one
              // peeks in to show it scrolls), 3 on a tablet, 4 on a laptop or desktop
              breakpoints={{
                0: { slidesPerView: 2.15, spaceBetween: 12 },
                640: { slidesPerView: 2.5, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="!pb-1"
            >
              {products!.map((p) => (
                <SwiperSlide key={p.id} className="!h-auto">
                  <ProductCard {...mapProductToCard(p)} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}
