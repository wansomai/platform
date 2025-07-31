// lib/validations.ts
import { z } from 'zod'

// Location schema with international support
export const locationSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().optional()
})

// Step 1: Practice Information validation (includes firm story)
export const practiceInfoSchema = z.object({
  firmName: z.string().min(1, 'Firm name is required').max(100, 'Firm name must be less than 100 characters'),
  contactEmail: z.string().email('Please enter a valid email address'),
  contactPhone: z.string().optional().refine((phone) => {
    if (!phone) return true
    // International phone number validation (basic)
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,14}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
  }, 'Please enter a valid phone number'),
  yearsInPractice: z.number().min(0, 'Years in practice must be 0 or greater').max(50, 'Years in practice must be 50 or less').nullable(),
  firmSize: z.enum(['solo', 'small', 'medium', 'large'], {
    errorMap: () => ({ message: 'Please select a firm size' })
  }),
  linkedinUrl: z.string().optional().refine((url) => {
    if (!url) return true
    const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/
    return linkedinRegex.test(url)
  }, 'Please enter a valid LinkedIn profile URL'),
  currentWebsite: z.string().optional().refine((url) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, 'Please enter a valid website URL'),
  firmStory: z.string().min(50, 'Please provide at least 50 characters describing your firm') // NEW: Added firm story validation
})

// Step 2: Practice Areas validation with plan limits
export const practiceAreasSchema = z.object({
  practiceAreas: z.array(z.string()).min(1, 'Please select at least one practice area').max(50, 'Too many practice areas selected'),
  customPracticeArea: z.string().optional()
}).refine((data) => {
  // Additional validation can be added here for plan limits
  return true
}, 'Practice area selection exceeds plan limits')

// Step 3: Geographic Coverage validation with international support
export const locationsSchema = z.object({
  primaryLocation: locationSchema.refine((location) => {
    return location.city && location.country && location.address
  }, 'Primary location with complete address is required'),
  serviceAreas: z.array(locationSchema).max(50, 'Maximum 50 service areas allowed')
}).refine((data) => {
  // Additional validation for plan limits can be added here
  return true
}, 'Location selection exceeds plan limits')

// Plan Selection validation (auto-assigned)
export const planSelectionSchema = z.object({
  selectedPlan: z.enum(['lite', 'professional', 'enterprise'], {
    errorMap: () => ({ message: 'Please select a plan' })
  }),
  billingCycle: z.enum(['monthly', 'annually']).default('monthly')
})

// Complete onboarding form validation
export const completeOnboardingSchema = practiceInfoSchema
  .and(practiceAreasSchema)
  .and(locationsSchema)
  .and(planSelectionSchema);

// API request schemas
export const createUserProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firmName: z.string().min(1, 'Firm name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  yearsInPractice: z.number().nullable(),
  firmSize: z.string(),
  linkedinUrl: z.string().optional(),
  currentWebsite: z.string().optional(),
  firmStory: z.string().min(50, 'Firm story must be at least 50 characters'), // NEW: Added firmStory
  primaryLocation: z.object({
    country: z.string(),
    city: z.string(),
    address: z.string(),
    zipCode: z.string().optional()
  }),
  serviceAreas: z.array(z.object({
    country: z.string(),
    city: z.string(),
    address: z.string(),
    zipCode: z.string().optional()
  })),
  practiceAreas: z.array(z.string()),
  hasCurrentWebsite: z.boolean(),
  selectedPlan: z.string(),
  billingCycle: z.string()
})

// Subscription creation schema
export const createSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planName: z.enum(['lite', 'professional', 'enterprise']),
  planPrice: z.string(),
  billingCycle: z.enum(['monthly', 'annually']),
  paystackCustomerId: z.string().optional(),
  paystackSubscriptionId: z.string().optional()
})

// Payment verification schema
export const paymentVerificationSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
  userId: z.string().min(1, 'User ID is required')
})

// Onboarding analytics schema
export const onboardingAnalyticsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  stepName: z.string().min(1, 'Step name is required'),
  stepNumber: z.number().min(1).max(3), // UPDATED: Changed from max(5) to max(3)
  stepData: z.record(z.any()).optional(),
  timeSpent: z.number().optional()
})

// Type exports for TypeScript
export type PracticeInfoData = z.infer<typeof practiceInfoSchema>
export type PracticeAreasData = z.infer<typeof practiceAreasSchema>
export type LocationsData = z.infer<typeof locationsSchema>
export type PlanSelectionData = z.infer<typeof planSelectionSchema>
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>
export type CreateUserProfileData = z.infer<typeof createUserProfileSchema>
export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>
export type PaymentVerificationData = z.infer<typeof paymentVerificationSchema>
export type OnboardingAnalyticsData = z.infer<typeof onboardingAnalyticsSchema>
export type LocationData = z.infer<typeof locationSchema>

// Validation helper functions - UPDATED for 3 steps
export const validateStep = (step: number, data: any) => {
  switch (step) {
    case 1:
      return practiceInfoSchema.safeParse(data)
    case 2:
      return practiceAreasSchema.safeParse(data)
    case 3:
      return locationsSchema.safeParse(data)
    default:
      return { success: false, error: { issues: [{ message: 'Invalid step' }] } }
  }
}

// Form field error extractor
export const extractFieldErrors = (zodError: z.ZodError): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {}
  
  zodError.issues.forEach((issue) => {
    const fieldName = issue.path.join('.')
    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = []
    }
    fieldErrors[fieldName].push(issue.message)
  })
  
  return fieldErrors
}

// Enhanced pricing configuration with international currency support
export const PRICING_CONFIG = {
  plans: {
    lite: {
      name: 'Lite',
      monthlyPrice: 29,
      annualPrice: 25,
      features: [
        'Optimized AI search profile',
        '5 Optimized content pages',
        'Personalized profile FAQs',
        'Weekly competitor ranking insights',
        'Weekly keyword research and rotation',
        'Up to 3 practice area profiles',
        'Up to 3 location profile rankings',
        'Access to Wansom AI legal Assistant'
      ],
      limits: {
        maxPracticeAreas: 3,
        maxLocations: 3,
        contentPages: 5
      }
    },
    professional: {
      name: 'Professional',
      monthlyPrice: 87,
      annualPrice: 85,
      features: [
        'Optimized AI search profile',
        '10 weekly Optimized content pages',
        'Personalized profile FAQs',
        'Deep weekly competitor ranking insights with reports',
        'Weekly keyword research and rotation',
        'Up to 15 practice area profiles',
        'Unlimited location profile rankings',
        'Access to Wansom AI legal Assistant'
      ],
      limits: {
        maxPracticeAreas: 15,
        maxLocations: Infinity,
        contentPages: 10
      }
    },
    enterprise: {
      name: 'Enterprise',
      monthlyPrice: 199,
      annualPrice: 195,
      features: [
        'Optimized AI search profile',
        'Unlimited Optimized content pages',
        'Personalized profile FAQs',
        'Optimized AI profiles for team members',
        'Deep weekly competitor ranking insights with reports',
        'Weekly keyword research and rotation',
        'Unlimited practice area profiles',
        'Unlimited location profile rankings',
        'Access to Wansom legal AI suite'
      ],
      limits: {
        maxPracticeAreas: Infinity,
        maxLocations: Infinity,
        contentPages: Infinity
      }
    }
  },
  currencies: {
    USD: { symbol: '$', name: 'US Dollar' },
    NGN: { symbol: '₦', name: 'Nigerian Naira', multiplier: 1600 }, // Approximate exchange rate
    GBP: { symbol: '£', name: 'British Pound', multiplier: 0.8 },
    EUR: { symbol: '€', name: 'Euro', multiplier: 0.9 },
    CAD: { symbol: 'C$', name: 'Canadian Dollar', multiplier: 1.35 }
  },
  defaultCurrency: 'USD',
  annualDiscount: 0.2 // 20% discount for annual billing
}

// Helper function to get price in different currencies
export const getPriceInCurrency = (basePrice: number, currency: string = 'USD') => {
  const currencyConfig = PRICING_CONFIG.currencies[currency as keyof typeof PRICING_CONFIG.currencies]
  if (!currencyConfig) return basePrice
  
  const convertedPrice =
    currency === 'USD'
      ? basePrice
      : Math.round(
          basePrice *
            (typeof (currencyConfig as any).multiplier === 'number'
              ? (currencyConfig as { multiplier: number }).multiplier
              : 1)
        )
  return {
    amount: convertedPrice,
    symbol: currencyConfig.symbol,
    formatted: `${currencyConfig.symbol}${convertedPrice.toLocaleString()}`
  }
}

// Plan validation helper
export const validatePlanLimits = (formData: any, planId: string) => {
  const plan = PRICING_CONFIG.plans[planId as keyof typeof PRICING_CONFIG.plans]
  if (!plan) return { valid: false, errors: ['Invalid plan selected'] }

  const errors: string[] = []
  
  // Check practice areas limit
  if (formData.practiceAreas && formData.practiceAreas.length > plan.limits.maxPracticeAreas) {
    errors.push(`Your ${plan.name} plan allows up to ${plan.limits.maxPracticeAreas} practice areas`)
  }
  
  // Check locations limit
  const totalLocations = (formData.primaryLocation ? 1 : 0) + (formData.serviceAreas?.length || 0)
  if (plan.limits.maxLocations !== Infinity && totalLocations > plan.limits.maxLocations) {
    errors.push(`Your ${plan.name} plan allows up to ${plan.limits.maxLocations} total locations`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}