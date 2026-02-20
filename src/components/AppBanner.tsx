const AppBanner = () => {
  return (
    <div className="mx-6 md:mx-12 mb-8 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 flex items-center justify-between">
      <div>
        <p className="text-foreground text-sm font-semibold">
          Enjoy the Best Experience
        </p>
        <p className="text-muted-foreground text-xs">
          on the LUO FILM TV App
        </p>
      </div>
      <button className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
        Download
      </button>
    </div>
  );
};

export default AppBanner;
