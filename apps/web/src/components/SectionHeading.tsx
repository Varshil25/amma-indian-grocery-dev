import React from "react";

interface SectionHeadingProps {
  /** Small line above the title, e.g. "Categories" */
  eyebrow?: string;
  /** Title text; `highlight` is appended in green, e.g. "Featured" + "Categories" */
  title: string;
  highlight?: string;
  /** Optional line under the title */
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * Every section title on the store uses this, so they all have the same size on every screen
 * (text-h3: 28px on a phone up to 48px on a desktop) and the same small line above.
 */
const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  highlight,
  description,
  align = "center",
  className = "",
}) => (
  <div className={`${align === "center" ? "text-center mx-auto" : "text-left"} ${className}`}>
    {eyebrow && <p className="text-body-md text-text-300 mb-1">{eyebrow}</p>}
    <h2 className="text-h3 font-semibold text-text-500">
      {title}
      {highlight && (
        <>
          {" "}
          <span className="text-green-500">{highlight}</span>
        </>
      )}
    </h2>
    {description && <div className="text-body-lg text-text-300 mt-3">{description}</div>}
  </div>
);

export default SectionHeading;
