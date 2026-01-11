import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Foods() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Foods</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Food
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button className="pb-2 px-1 border-b-2 border-blue-600 text-blue-600 font-medium">
          My Foods
        </button>
        <button className="pb-2 px-1 text-gray-500 hover:text-gray-700">
          Common Foods
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No foods yet</h3>
        <p className="text-gray-500 mb-4">
          Add your first custom food to quickly log meals.
        </p>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Your First Food
        </Button>
      </div>

      {/* TODO: Food list will go here */}
    </div>
  );
}
