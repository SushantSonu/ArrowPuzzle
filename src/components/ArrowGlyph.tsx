import { motion } from "framer-motion";

interface ArrowGlyphProps {
  /** rotation in degrees; pass an accumulating value (e.g. keeps growing past 360)
   * from the caller so repeated rotations always spin the short way forward. */
  rotation: number;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
  animate?: boolean;
}

export default function ArrowGlyph({
  rotation,
  size = 32,
  className = "",
  color = "currentColor",
  strokeWidth = 2.4,
  animate = true,
}: ArrowGlyphProps) {
  const inner = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.5L12 19.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M5.5 10.5L12 3.5L18.5 10.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!animate) {
    return (
      <div className={className} style={{ transform: `rotate(${rotation}deg)` }}>
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      animate={{ rotate: rotation }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      style={{ transformOrigin: "50% 50%" }}
    >
      {inner}
    </motion.div>
  );
}
