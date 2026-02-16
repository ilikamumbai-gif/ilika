import React from 'react'

const Heading = ({heading}) => {
    return (
        <>
            <div>
                <div className="w-full pimary-bg-color py-3 sm:py-6">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-4">

                        {/* Left line */}
                        <div className="flex-1 h-px divider-bg-color"></div>

                        {/* Text */}
                        <h2 className="heading-color text-sm sm:text-lg md:text-2xl font-semibold tracking-wide whitespace-nowrap">
                            {heading}
                        </h2>

                        {/* Right line */}
                        <div className="flex-1 h-px divider-bg-color"></div>

                    </div>
                </div>
            </div >
        </>
    )
}

export default Heading 