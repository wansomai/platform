import { useOnboardingStore } from "@/store/onboarding.store";
import { CheckCircle, Circle, Plus, Scale, X } from "lucide-react";
import { useState } from "react";

export const PracticeAreasStep = () => {
  const { formData, togglePracticeArea, practiceAreaOptions, updateFormData, errors } =
    useOnboardingStore();
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Select Your Practice Areas
        </h2>
        <p className="text-gray-600 mt-2">
          Choose all areas where your firm provides legal services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {practiceAreaOptions.map((area) => (
          <div
            key={area.id}
            onClick={() => togglePracticeArea(area.name)}
            className={`
              p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
              ${
                formData.practiceAreas.includes(area.name)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 hover:border-primary/50"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{area.name}</span>
              {formData.practiceAreas.includes(area.name) ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {errors.practiceAreas && (
        <p className="text-red-600 text-sm mt-2">{errors.practiceAreas[0]}</p>
      )}

      {/* Custom Practice Area */}
      <div className="mt-6">
        {!showCustomInput ? (
          <button
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Custom Practice Area
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.customPracticeArea}
              onChange={(e) =>
                updateFormData("customPracticeArea", e.target.value)
              }
              placeholder="Enter custom practice area"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === "Enter" && formData.customPracticeArea.trim()) {
                  togglePracticeArea(formData.customPracticeArea.trim());
                  updateFormData("customPracticeArea", "");
                  setShowCustomInput(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (formData.customPracticeArea.trim()) {
                  togglePracticeArea(formData.customPracticeArea.trim());
                  updateFormData("customPracticeArea", "");
                }
                setShowCustomInput(false);
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowCustomInput(false);
                updateFormData("customPracticeArea", "");
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {formData.practiceAreas.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">
            Selected Practice Areas:
          </p>
          <div className="flex flex-wrap gap-2">
            {formData.practiceAreas.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {area}
                <button
                  onClick={() => togglePracticeArea(area)}
                  className="hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};