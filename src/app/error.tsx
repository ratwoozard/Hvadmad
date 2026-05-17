"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <Icon name="status-x-circle" size={72} />
      <h2 className="text-2xl font-bold text-gray-900">Noget gik galt</h2>
      <p className="text-center text-gray-600">
        Der opstod en fejl. Prøv at genindlæse siden.
      </p>
      <Button onClick={reset} className="mt-4">
        <Icon name="ui-arrows-up-down" size={20} className="mr-2" /> Prøv igen
      </Button>
      <Button as="a" href="/" variant="secondary">
        <Icon name="nav-home" size={20} className="mr-2" /> Gå til forsiden
      </Button>
    </div>
  );
}
