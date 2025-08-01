import React, { useState } from 'react';
import { LocationData, useOnboardingStore, PLAN_LIMITS } from '@/store/onboarding.store';
import CountrySelector from '@/components/commons/country-selector';
import { COUNTRIES } from '@/lib/country-picker/countries';
import { SelectMenuOption } from '@/types/countries';
import { 
  MapPin, 
  Plus,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

// Step 3: Geographic Coverage Component with International Support
const LocationsStep = () => {
  const { 
    formData, 
    updateFormData, 
    addServiceArea, 
    removeServiceArea, 
    warnings,
    clearWarnings,
    getPlanLimits 
  } = useOnboardingStore();
  
  const [newLocation, setNewLocation] = useState<LocationData>({
    country: 'Kenya',
    city: '',
    address: '',
    zipCode: ''
  });
  const [showAddLocation, setShowAddLocation] = useState(false);
  
  // Country selector states
  const [isPrimaryCountryOpen, setIsPrimaryCountryOpen] = useState(false);
  const [isNewLocationCountryOpen, setIsNewLocationCountryOpen] = useState(false);

  const planLimits = getPlanLimits();
  const totalLocations = (formData.primaryLocation ? 1 : 0) + formData.serviceAreas.length;
  const canAddMore = totalLocations < planLimits.maxLocations;

  const handleAddLocation = () => {
    if (newLocation.city.trim() && newLocation.country && newLocation.address.trim()) {
      if (canAddMore) {
        addServiceArea(newLocation);
        setNewLocation({ country: 'Kenya', city: '', address: '', zipCode: '' });
        setShowAddLocation(false);
        clearWarnings('serviceAreas');
      }
    }
  };

  const setPrimaryLocation = (updates: Partial<LocationData>) => {
    const currentLocation = formData.primaryLocation || { country: '', city: '', address: '', zipCode: '' };
    updateFormData('primaryLocation', { ...currentLocation, ...updates });
  };

  const updateNewLocation = (updates: Partial<LocationData>) => {
    setNewLocation(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <p className="text-body text-gray-600 mt-2">Define where your firm provides legal services</p>
      </div>
      {/* Warnings */}
      {warnings.serviceAreas && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-medium text-yellow-800">Plan Limit Reached</h3>
          </div>
          <p className="text-sm text-yellow-700">{warnings.serviceAreas[0]}</p>
        </div>
      )}

      {/* Primary Location */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Office Location *</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <CountrySelector
              id="primary-country"
              open={isPrimaryCountryOpen}
              onToggle={() => setIsPrimaryCountryOpen(!isPrimaryCountryOpen)}
              onChange={(val) => setPrimaryLocation({ country: COUNTRIES.find(c => c.value === val)?.title || '' })}
              selectedValue={
                COUNTRIES.find(option => option.title === formData.primaryLocation?.country) || 
                COUNTRIES.find(option => option.title === 'Nigeria') as SelectMenuOption
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.primaryLocation?.city || ''}
              onChange={(e) => setPrimaryLocation({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Lagos, New York, London"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              value={formData.primaryLocation?.address || ''}
              onChange={(e) => setPrimaryLocation({ address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. 123 Victoria Island, Lagos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal/ZIP Code</label>
            <input
              type="text"
              value={formData.primaryLocation?.zipCode || ''}
              onChange={(e) => setPrimaryLocation({ zipCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. 100001, 10001, SW1A 1AA"
            />
          </div>
        </div>
      </div>

      {/* Service Areas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Locations</h3>
          {canAddMore ? (
            <button
              onClick={() => setShowAddLocation(true)}
              className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Info className="w-4 h-4 text-gray-3" />
          <span className="text-sm font-medium text-gray-500">
             {totalLocations}/{planLimits.maxLocations === Infinity ? '∞' : planLimits.maxLocations} locations
          </span>
            </div>
          )}
        </div>

        {/* Add Location Form */}
        {showAddLocation && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <CountrySelector
                  id="new-location-country"
                  open={isNewLocationCountryOpen}
                  onToggle={() => setIsNewLocationCountryOpen(!isNewLocationCountryOpen)}
                  onChange={(val) => updateNewLocation({ country: COUNTRIES.find(c => c.value === val)?.title || '' })}
                  selectedValue={
                    COUNTRIES.find(option => option.title === newLocation.country) || 
                    COUNTRIES.find(option => option.title === 'Nigeria') as SelectMenuOption
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={newLocation.city}
                  onChange={(e) => updateNewLocation({ city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => updateNewLocation({ address: e.target.value })}
                  placeholder="Address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={newLocation.zipCode}
                  onChange={(e) => updateNewLocation({ zipCode: e.target.value })}
                  placeholder="Postal Code (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddLocation}
                disabled={!canAddMore}
                className={`px-4 py-2 rounded-md transition-colors ${
                  canAddMore
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddLocation(false);
                  setNewLocation({ country: 'Nigeria', city: '', address: '', zipCode: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Service Areas List */}
        {formData.serviceAreas.length > 0 && (
          <div className="space-y-2">
            {formData.serviceAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div>
                  <span className="font-medium">
                    {area.city}, {area.country}
                  </span>
                  <p className="text-sm text-gray-600">{area.address}</p>
                  {area.zipCode && (
                    <p className="text-xs text-gray-500">{area.zipCode}</p>
                  )}
                </div>
                <button
                  onClick={() => removeServiceArea(index)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export { LocationsStep };