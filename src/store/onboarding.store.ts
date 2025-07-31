// stores/onboarding.store.ts - Updated for 3 steps
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PracticeAreaOption {
  id: string
  name: string
  selected: boolean
}

export interface LocationData {
  country: string
  city: string
  address: string
  zipCode?: string
}

export interface OnboardingFormData {
  // Step 1: Practice Information (includes firm story)
  firmName: string
  contactEmail: string
  contactPhone: string
  yearsInPractice: number | null
  firmSize: string
  linkedinUrl: string
  currentWebsite: string
  firmStory: string // NEW: Moved from marketing step
  
  // Step 2: Practice Areas
  practiceAreas: string[]
  customPracticeArea: string
  
  // Step 3: Geographic Coverage
  primaryLocation: LocationData | null
  serviceAreas: LocationData[]
  
  // Plan Selection (auto-determined)
  selectedPlan: string
  billingCycle: 'monthly' | 'annually'
  
  // User ID (required for API calls)
  userId?: string
}

// Plan limits based on firm size
export const PLAN_LIMITS = {
  lite: {
    maxPracticeAreas: 3,
    maxLocations: 3,
    contentPages: 5,
    name: 'Lite'
  },
  professional: {
    maxPracticeAreas: 15,
    maxLocations: Infinity,
    contentPages: 10,
    name: 'Professional'
  },
  enterprise: {
    maxPracticeAreas: Infinity,
    maxLocations: Infinity,
    contentPages: Infinity,
    name: 'Enterprise'
  }
}

// Auto-assign plan based on firm size
export const AUTO_PLAN_ASSIGNMENT = {
  solo: 'lite',
  small: 'professional',
  medium: 'professional',
  large: 'enterprise'
}

interface OnboardingState {
  // Current state
  currentStep: number
  totalSteps: number
  isSubmitting: boolean
  formData: OnboardingFormData
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  
  // Available options
  practiceAreaOptions: PracticeAreaOption[]
  
  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateFormData: <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) => void
  updateNestedFormData: (updates: Partial<OnboardingFormData>) => void
  setSubmitting: (loading: boolean) => void
  setErrors: (field: string, errors: string[]) => void
  setWarnings: (field: string, warnings: string[]) => void
  clearErrors: (field?: string) => void
  clearWarnings: (field?: string) => void
  validateStep: (step: number) => boolean
  resetStore: () => void
  checkAndResetIfCompleted: (userHasCompletedOnboarding: boolean) => void
  
  // Step-specific actions
  togglePracticeArea: (areaName: string) => void
  addServiceArea: (location: LocationData) => void
  removeServiceArea: (index: number) => void
  
  // Plan management
  getSelectedPlan: () => string
  getPlanLimits: () => typeof PLAN_LIMITS.lite
  checkPlanLimits: () => void
  
  // User ID management
  setUserId: (userId: string) => void
  getUserId: () => string | undefined
}

const initialFormData: OnboardingFormData = {
  // Step 1
  firmName: '',
  contactEmail: '',
  contactPhone: '',
  yearsInPractice: null,
  firmSize: '',
  linkedinUrl: '',
  currentWebsite: '',
  firmStory: '', // NEW: Added firmStory
  
  // Step 2
  practiceAreas: [],
  customPracticeArea: '',
  
  // Step 3
  primaryLocation: null,
  serviceAreas: [],
  
  // Plan Selection
  selectedPlan: 'lite',
  billingCycle: 'monthly',
  
  // User ID
  userId: undefined
}

const defaultPracticeAreas: PracticeAreaOption[] = [
  { id: 'personal-injury', name: 'Personal Injury', selected: false },
  { id: 'criminal-defense', name: 'Criminal Defense', selected: false },
  { id: 'family-law', name: 'Family Law', selected: false },
  { id: 'business-law', name: 'Business Law', selected: false },
  { id: 'real-estate', name: 'Real Estate Law', selected: false },
  { id: 'employment', name: 'Employment Law', selected: false },
  { id: 'immigration', name: 'Immigration Law', selected: false },
  { id: 'estate-planning', name: 'Estate Planning', selected: false },
  { id: 'bankruptcy', name: 'Bankruptcy', selected: false },
  { id: 'intellectual-property', name: 'Intellectual Property', selected: false },
  { id: 'corporate', name: 'Corporate Law', selected: false },
  { id: 'tax', name: 'Tax Law', selected: false },
]

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state - Updated to 3 steps
      currentStep: 1,
      totalSteps: 3, // CHANGED: From 4 to 3 steps
      isSubmitting: false,
      formData: initialFormData,
      errors: {},
      warnings: {},
      practiceAreaOptions: defaultPracticeAreas,
      
      // Navigation actions
      setStep: (step: number) => {
        const clampedStep = Math.max(1, Math.min(step, get().totalSteps))
        set({ currentStep: clampedStep })
      },
      
      nextStep: () => {
        const { currentStep, totalSteps, validateStep } = get()
        if (validateStep(currentStep) && currentStep < totalSteps) {
          set({ currentStep: currentStep + 1 })
        }
      },
      
      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },
      
      // Form data actions - Fixed to prevent infinite loops
      updateFormData: (key, value) => {
        set((state) => {
          // Prevent unnecessary updates if value hasn't changed
          if (state.formData[key] === value) {
            return state
          }

          const newFormData = { ...state.formData, [key]: value }
          
          // Auto-assign plan when firm size changes
          if (key === 'firmSize' && value) {
            const autoPlan = AUTO_PLAN_ASSIGNMENT[value as keyof typeof AUTO_PLAN_ASSIGNMENT]
            if (autoPlan && autoPlan !== newFormData.selectedPlan) {
              newFormData.selectedPlan = autoPlan
            }
          }
          
          return { formData: newFormData }
        })
        
        // Clear errors for the field being updated - do this outside of set to prevent loops
        const currentErrors = get().errors
        if (currentErrors[key as string]) {
          set((state) => {
            const { [key as string]: _, ...restErrors } = state.errors
            return { errors: restErrors }
          })
        }
      },
      
      updateNestedFormData: (updates) => {
        set((state) => ({
          formData: { ...state.formData, ...updates }
        }))
      },
      
      // UI state actions
      setSubmitting: (loading: boolean) => {
        set({ isSubmitting: loading })
      },
      
      // Error handling - Fixed to prevent re-render loops
      setErrors: (field: string, errors: string[]) => {
        set((state) => {
          // Only update if errors have actually changed
          const currentFieldErrors = state.errors[field]
          if (currentFieldErrors && 
              currentFieldErrors.length === errors.length && 
              currentFieldErrors.every((err, idx) => err === errors[idx])) {
            return state
          }
          
          return {
            errors: { ...state.errors, [field]: errors }
          }
        })
      },
      
      setWarnings: (field: string, warnings: string[]) => {
        set((state) => {
          // Only update if warnings have actually changed
          const currentFieldWarnings = state.warnings[field]
          if (currentFieldWarnings && 
              currentFieldWarnings.length === warnings.length && 
              currentFieldWarnings.every((warn, idx) => warn === warnings[idx])) {
            return state
          }
          
          return {
            warnings: { ...state.warnings, [field]: warnings }
          }
        })
      },
      
      clearErrors: (field?: string) => {
        set((state) => {
          if (field) {
            if (!state.errors[field]) return state // No change needed
            const { [field]: _, ...rest } = state.errors
            return { errors: rest }
          }
          return state.errors && Object.keys(state.errors).length > 0 ? { errors: {} } : state
        })
      },
      
      clearWarnings: (field?: string) => {
        set((state) => {
          if (field) {
            if (!state.warnings[field]) return state // No change needed
            const { [field]: _, ...rest } = state.warnings
            return { warnings: rest }
          }
          return state.warnings && Object.keys(state.warnings).length > 0 ? { warnings: {} } : state
        })
      },
      
      // Validation - Updated for 3 steps
      validateStep: (step: number): boolean => {
        const { formData } = get()
        
        switch (step) {
          case 1: // Practice Information (including firm story)
            return !!(
              formData.firmName.trim() &&
              formData.contactEmail.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) &&
              formData.firmSize &&
              formData.firmStory && // NEW: Validate firm story
              formData.firmStory.trim().length >= 50 // Minimum length requirement
            )
          
          case 2: // Practice Areas
            return formData.practiceAreas.length > 0
          
          case 3: // Locations
            return !!(
              formData.primaryLocation &&
              formData.primaryLocation.country &&
              formData.primaryLocation.city &&
              formData.primaryLocation.address
            )
          
          default:
            return true
        }
      },
      
      // Step-specific actions - Fixed to prevent loops
      togglePracticeArea: (areaName: string) => {
        set((state) => {
          const areas = state.formData.practiceAreas
          const isSelected = areas.includes(areaName)
          
          let newAreas
          if (isSelected) {
            newAreas = areas.filter(area => area !== areaName)
          } else {
            // Check plan limits
            const planLimits = get().getPlanLimits()
            if (areas.length >= planLimits.maxPracticeAreas) {
              // Don't add if at limit - could set warning here
              return state
            }
            newAreas = [...areas, areaName]
          }
          
          return {
            formData: {
              ...state.formData,
              practiceAreas: newAreas
            }
          }
        })
      },
      
      addServiceArea: (location: LocationData) => {
        set((state) => {
          const planLimits = get().getPlanLimits()
          const currentLocations = state.formData.serviceAreas.length + 1 // +1 for primary location
          
          if (currentLocations >= planLimits.maxLocations) {
            return state
          }
          
          return {
            formData: {
              ...state.formData,
              serviceAreas: [...state.formData.serviceAreas, location]
            }
          }
        })
      },
      
      removeServiceArea: (index: number) => {
        set((state) => ({
          formData: {
            ...state.formData,
            serviceAreas: state.formData.serviceAreas.filter((_, i) => i !== index)
          }
        }))
      },
      
      // Plan management - Made pure functions
      getSelectedPlan: () => {
        return get().formData.selectedPlan
      },
      
      getPlanLimits: () => {
        const plan = get().formData.selectedPlan as keyof typeof PLAN_LIMITS
        return PLAN_LIMITS[plan] || PLAN_LIMITS.lite
      },
      
      checkPlanLimits: () => {
        // This function can trigger warnings but shouldn't cause re-renders
        // Removed automatic warning setting to prevent loops
      },
      
      // User ID management - Fixed to prevent loops
      setUserId: (userId: string) => {
        set((state) => {
          // Only update if userId has actually changed
          if (state.formData.userId === userId) {
            return state
          }
          
          return {
            formData: { ...state.formData, userId }
          }
        })
      },
      
      getUserId: () => {
        return get().formData.userId
      },
      
      // Reset - Clear all data including persisted state
      resetStore: () => {
        const storageKey = 'wansom-onboarding'
        try {
          const currentData = localStorage.getItem(storageKey)
          if (currentData) {
            const parsed = JSON.parse(currentData)
            parsed.state._isCompleted = true
            localStorage.setItem(storageKey, JSON.stringify(parsed))
          }
        } catch (error) {
          console.warn('Error marking onboarding as completed:', error)
        }
        
        // Clear the store state
        set({
          currentStep: 1,
          isSubmitting: false,
          formData: initialFormData,
          errors: {},
          warnings: {},
          practiceAreaOptions: defaultPracticeAreas
        })
        
        // Remove the persisted state after a short delay
        setTimeout(() => {
          localStorage.removeItem(storageKey)
        }, 100)
      },

      // Check if store should be reset based on user completion status
      checkAndResetIfCompleted: (userHasCompletedOnboarding: boolean) => {
        if (userHasCompletedOnboarding) {
          // User has completed onboarding, reset the store
          get().resetStore()
        }
      }
    }),
    {
      name: 'wansom-onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData
      }),
      // Add version for future migrations
      version: 1,
    }
  )
)