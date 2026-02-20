import { useState } from "react";
import { genreTags } from "@/data/dramas";

const GenreTags = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="px-6 md:px-12 mb-8">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {genreTags.map((tag, i) => (
          <button
            key={tag}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
};

export default GenreTags;
