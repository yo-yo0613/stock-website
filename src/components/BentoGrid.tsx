import type { ReactNode } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "../lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 mx-auto",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  ...props
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
} & HTMLMotionProps<"div">) => {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "tween", duration: 0.5, ease: "easeOut" }
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        scale: 1.015, 
        y: -4, 
        boxShadow: "0 10px 40px -10px rgba(59,130,246,0.15)",
        borderColor: "rgba(59,130,246,0.4)"
      }}
      transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      {...props}
      className={cn(
        "row-span-1 rounded-2xl group/bento p-4 dark:bg-card dark:border-white/[0.05] bg-card border border-border flex flex-col justify-between overflow-hidden relative",
        className
      )}
    >
      {/* Background radial gradient glow via CSS hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-300 mt-2 z-10 relative">
        {icon}
        {title && <div className="font-sans font-bold text-neutral-200 mb-2 mt-2">{title}</div>}
        {description && (
          <div className="font-sans font-normal text-neutral-400 text-xs">
            {description}
          </div>
        )}
      </div>
    </motion.div>
  );
};
