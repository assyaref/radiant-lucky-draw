import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  registerParticipant,
  type RegisterParticipantResponse,
} from '../../features/registration/api';
import { ApiClientError } from '../../api/client';

export type RegistrationStep = 'splash' | 'welcome' | 'form' | 'confirmation' | 'waiting';

export interface FormData {
  fullName: string;
  phone: string;
  company: string;
  email: string;
  agreeTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  company?: string;
  email?: string;
  agreeTerms?: string;
}

export interface RegistrationResult {
  queueNumber: string;
  estimatedWait: number;
  currentQueue: number;
  status: string;
  registeredAt: string;
}

interface RegistrationState {
  step: RegistrationStep;
  formData: FormData;
  errors: FormErrors;
  queueNumber: string;
  estimatedWait: number;
  currentQueue: number;
  status: string;
  isSubmitting: boolean;
  submitError: string | null;
  goToStep: (step: RegistrationStep) => void;
  updateField: (field: keyof FormData, value: string | boolean) => void;
  validateField: (field: keyof FormData) => string | undefined;
  validateAll: () => boolean;
  submitRegistration: () => Promise<void>;
  retryRegistration: () => Promise<void>;
  clearSubmitError: () => void;
}

const RegistrationContext = createContext<RegistrationState | null>(null);

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
  return ctx;
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<RegistrationStep>('splash');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    company: '',
    email: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [queueNumber, setQueueNumber] = useState('');
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [currentQueue, setCurrentQueue] = useState(0);
  const [status, setStatus] = useState('');

  const goToStep = useCallback((s: RegistrationStep) => {
    setStep(s);
  }, []);

  const validateField = useCallback(
    (field: keyof FormData): string | undefined => {
      const value = formData[field];

      switch (field) {
        case 'fullName':
          if (!value || (typeof value === 'string' && !value.trim()))
            return 'Full name is required';
          if (typeof value === 'string' && value.trim().length < 2)
            return 'Name must be at least 2 characters';
          return undefined;

        case 'phone':
          if (!value || (typeof value === 'string' && !value.trim()))
            return 'Phone number is required';
          if (typeof value === 'string' && !/^[+]?[\d\s()-]{8,15}$/.test(value.trim()))
            return 'Invalid phone number format';
          return undefined;

        case 'company':
          if (!value || (typeof value === 'string' && !value.trim()))
            return 'Company name is required';
          return undefined;

        case 'email':
          if (value && typeof value === 'string' && value.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email format';
          }
          return undefined;

        case 'agreeTerms':
          if (!value) return 'You must agree to the terms';
          return undefined;

        default:
          return undefined;
      }
    },
    [formData],
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const fields: (keyof FormData)[] = ['fullName', 'phone', 'company', 'email', 'agreeTerms'];

    for (const field of fields) {
      const error = validateField(field);
      if (error) newErrors[field] = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField]);

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    // Clear submit error when user edits the form
    setSubmitError(null);
  }, []);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const submitRegistration = useCallback(async () => {
    if (!validateAll()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result: RegisterParticipantResponse = await registerParticipant({
        name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        email: formData.email.trim() || undefined,
      });

      setQueueNumber(result.queueNumber);
      setEstimatedWait(result.estimatedWait);
      setCurrentQueue(result.currentQueue);
      setStatus(result.status);
      setIsSubmitting(false);
      setStep('confirmation');
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof ApiClientError) {
        setSubmitError(mapApiError(err));
      } else {
        const msg = (err as any)?.message ?? '';
        setSubmitError(msg || 'Registration failed. Please check your connection and try again.');
      }
    }
  }, [validateAll, formData]);

  const retryRegistration = useCallback(async () => {
    await submitRegistration();
  }, [submitRegistration]);

  return (
    <RegistrationContext.Provider
      value={{
        step,
        formData,
        errors,
        queueNumber,
        estimatedWait,
        currentQueue,
        status,
        isSubmitting,
        submitError,
        goToStep,
        updateField,
        validateField,
        validateAll,
        submitRegistration,
        retryRegistration,
        clearSubmitError,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

function mapApiError(err: ApiClientError): string {
  switch (err.code) {
    case 'CONFLICT':
      return 'This phone number is already registered.';
    case 'VALIDATION_ERROR':
      return err.message || 'Please check your details and try again.';
    case 'NETWORK_ERROR':
      return 'Network unavailable. Please check your connection and try again.';
    case 'TIMEOUT':
      return 'The request timed out. Please try again.';
    case 'RATE_LIMIT':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      if (err.status === 400) return err.message || 'Registration is closed.';
      if (err.status >= 500) return 'Server error. Please try again later.';
      return err.message || 'Unable to register. Please try again.';
  }
}
