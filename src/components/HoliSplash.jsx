import { useEffect, useState } from "react";

const colors = [
  "#ff4d4d",
  "#ffcc00",
  "#00e600",
  "#00ccff",
  "#9933ff",
  "#ff66cc",
  "#ff6600"
];

const HoliSplash = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setItems(generated);

    setTimeout(() => {
      setItems([]);
    }, 5000);
  }, []);

  return (
    <div className="holi-container">
      {items.map((item) => (
        <div
          key={item.id}
          className="balloon-wrapper"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`
          }}
        >
          <div
            className="balloon"
            style={{ backgroundColor: item.color }}
          />
          <div
            className="splash"
            style={{ backgroundColor: item.color }}
          />
        </div>
      ))}
    </div>
  );
};

export default HoliSplash;