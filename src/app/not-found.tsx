import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <Icon name="status-info" size={72} />
      <h2 className="text-2xl font-bold text-gray-900">Side ikke fundet</h2>
      <p className="text-center text-gray-600">
        Den side du leder efter eksisterer ikke.
      </p>
      <Button as="a" href="/" className="mt-4">
        <Icon name="nav-home" size={20} className="mr-2" /> Gå til forsiden
      </Button>
    </div>
  );
}
