"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { Card } from "./Card";
import { EASING } from "@/lib/motion/tokens";

interface ConnectionLostProps {
  onRetry: () => void;
}

export default function ConnectionLost({ onRetry }: ConnectionLostProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conn-lost-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASING.out }}
        className="mx-4 w-full max-w-sm"
      >
        <Card className="text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">
            📡
          </div>
          <h2 id="conn-lost-title" className="text-xl font-bold text-gray-900">
            Forbindelse mistet
          </h2>
          <p className="mt-2 text-gray-600">
            Vi prøver at genoprette forbindelsen...
          </p>
          <Button
            onClick={handleRetry}
            disabled={retrying}
            loading={retrying}
            fullWidth
            className="mt-4"
          >
            {retrying ? "Forbinder..." : "🔄 Prøv igen"}
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
}
