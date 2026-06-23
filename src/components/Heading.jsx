import React from 'react'

const Heading = ({
  heading,
  sub,
  align = "center",
  subVariant = "label",
  subClassName = "",
  headingClassName = "",
}) => {
  const isLeft = align === "left";
  const isParagraphSub = subVariant === "paragraph";

  return (
    <div
      className={`w-full flex flex-col py-3 sm:py-4 ${
        isLeft
          ? "items-start text-left px-0"
          : "items-center text-center px-4"
      } ${isParagraphSub ? "gap-3 sm:gap-4" : "gap-2 sm:gap-3"}`}
    >

     

      {/* Main heading */}
      <h1
        className={`max-w-4xl font-semibold leading-[1.08] tracking-tight text-neutral-900
                   text-2xl sm:text-2xl md:text-3xl lg:text-4xl ${headingClassName}`}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {heading}
      </h1>

       {/* Sub-label — optional */}
      {sub && (
        isParagraphSub ? (
          <p
            className={`max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-600 ${subClassName}`}
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {sub}
          </p>
        ) : (
          <h2
            className={`max-w-2xl text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 ${subClassName}`}
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {sub}
          </h2>
        )
      )}

    </div>
  )
}

export default Heading
