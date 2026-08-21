const EmiAvailableNotice = ({ tone = "light", className = "" }) => {
  const dark = tone === "dark";

  return (
    <aside
      className={`${dark
        ? "border-[#c4b5fd]/70 bg-[#7c3aed]/20 text-[#e9ddff] shadow-[0_0_24px_rgba(124,58,237,0.2)]"
        : "border-[#b78438]/45 bg-[#fff6df] text-[#6b4514] shadow-[0_8px_22px_rgba(183,132,56,0.12)]"
      } rounded-lg border px-4 py-3.5 ${className}`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.14em]">EMI available</p>
      <p className={`mt-1 text-xs leading-5 ${dark ? "text-[#ddd6fe]" : "text-[#86612b]"}`}>
        Flexible payment options are available at checkout.
      </p>
    </aside>
  );
};

export default EmiAvailableNotice;
