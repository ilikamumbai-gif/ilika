import React from 'react'

const Heading = ({ heading, sub, align = "center", subVariant = "label", subClassName = "" }) => {
  const isLeft = align === "left";
  const isParagraphSub = subVariant === "paragraph";

  return (
    <div className={`w-full flex flex-col gap-1.5 py-2 ${isLeft ? "items-start text-left px-0" : "items-center text-center px-4"}`}>

     

      {/* Main heading */}
      <h1
        className="mt-2 font-semibold leading-tight tracking-tight text-neutral-900
                   text-2xl sm:text-2xl md:text-3xl lg:text-4xl"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {heading}
      </h1>

       {/* Sub-label — optional */}
      {sub && (
        isParagraphSub ? (
          <p
            className={`text-sm sm:text-base leading-relaxed text-neutral-600 ${subClassName}`}
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {sub}
          </p>
        ) : (
          <h2
            className={`text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400 ${subClassName}`}
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
