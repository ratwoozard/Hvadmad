import { Icon } from "@/components/ui/Icon";

export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-bounce">
          <Icon name="food-pizza" size={56} />
        </div>
        <p className="mt-2 text-gray-500">Indlæser...</p>
      </div>
    </div>
  );
}
