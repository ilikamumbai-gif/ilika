import React from 'react'

const Heading = ({ heading, sub, align = "center" }) => {
  const isLeft = align === "left";

  return (
    <div className={`w-full flex flex-col gap-1.5 py-2 ${isLeft ? "items-start text-left px-0" : "items-center text-center px-4"}`}>

     

      {/* Main heading */}
      <h1
        className="m-0 font-semibold leading-tight tracking-tight text-neutral-900
                   text-2xl sm:text-2xl md:text-3xl lg:text-4xl"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {heading}
      </h1>

       {/* Sub-label — optional */}
      {sub && (
        <span
          className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {sub}
        </span>
      )}

    </div>
  )
}

export default Heading
