"use client";

import dynamic from "next/dynamic";

const DynamicWallScene = dynamic(() => import("@/components/wall/WallScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      Loading wall preview...
    </div>
  ),
});

const WallPreview = () => {
  return <DynamicWallScene />;
};

export default WallPreview;
