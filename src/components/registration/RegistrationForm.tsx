import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegistration, type FormData } from './RegistrationContext';

type FieldName = keyof FormData;

interface FieldProps {
  label: string;
  name: FieldName;
  type?: string;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
}

const FIELDS: FieldProps[] = [
  { label: 'Full Name', name: 'fullName', placeholder: 'Enter your full name', required: true, autoComplete: 'name' },
  { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: 'e.g. 08123456789', required: true, autoComplete: 'tel' },
  { label: 'Company', name: 'company', placeholder: 'Enter your company name', required: true, autoComplete: 'organization' },
  { label: 'Email (Optional)', name: 'email', type: 'email', placeholder: 'Enter your email', autoComplete: 'email' },
];

export function RegistrationForm() {
  const { formData, errors, updateField, validateField, submitRegistration, isSubmitting, submitError, retryRegistration } = useRegistration();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());


  const handleBlur = useCallback((name: string) => {
    setFocusedField(null);
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
    validateField(name as keyof FormData);
  }, [validateField]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched
    setTouchedFields(new Set<string>(FIELDS.map((f) => f.name)));
    submitRegistration();
  }, [submitRegistration]);

  return (
    <motion.div
      className="flex min-h-screen flex-col bg-[#020617] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="pt-16 pb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="mb-2 text-3xl font-black tracking-wider"
          style={{
            backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Register Now
        </motion.h1>
        <p className="text-sm font-light text-white/40">Fill in your details to join the draw</p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <motion.div
          className="flex-1 space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {FIELDS.map((field, i) => {
            const fieldName = field.name as keyof typeof formData;
            const value = formData[fieldName] as string;
            const error = errors[fieldName as keyof typeof errors];
            const isTouched = touchedFields.has(fieldName);
            const showError = isTouched && error;

            return (
              <motion.div
                key={fieldName}
                className="relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <label className="mb-1.5 block text-xs font-bold tracking-wider text-white/40 uppercase">
                  {field.label}
                  {field.required && <span className="ml-1 text-amber-400">*</span>}
                </label>

                <div className="relative">
                  <input
                    type={field.type || 'text'}
                    value={value}
                    onChange={(e) => updateField(fieldName, e.target.value)}
                    onFocus={() => setFocusedField(fieldName)}
                    onBlur={() => handleBlur(fieldName)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className={`w-full rounded-2xl border bg-white/[0.03] px-5 py-4 text-base text-white placeholder-white/20 backdrop-blur-sm transition-all outline-none ${
                      showError
                        ? 'border-red-400/50 focus:border-red-400'
                        : focusedField === fieldName
                          ? 'border-amber-400/50'
                          : 'border-white/10 focus:border-amber-400/30'
                    }`}
                  />

                  {/* Focus glow */}
                  {focusedField === fieldName && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl"
                      layoutId="fieldGlow"
                      animate={{ boxShadow: '0 0 20px rgba(251,191,36,0.1)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {showError && (
                    <motion.p
                      className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-300"
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Terms checkbox */}
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => updateField('agreeTerms', e.target.checked)}
                  className="peer sr-only"
                />
                <div
                  className={`h-5 w-5 rounded-md border transition-all ${
                    formData.agreeTerms
                      ? 'border-amber-400 bg-amber-400'
                      : errors.agreeTerms
                        ? 'border-red-400/50 bg-red-400/10'
                        : 'border-white/20 bg-white/[0.03]'
                  }`}
                >
                  {formData.agreeTerms && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="3" className="h-5 w-5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-white/40">
                I agree with{' '}
                <span className="text-amber-400/70">Terms & Conditions</span>
              </span>
            </label>

            <AnimatePresence>
              {errors.agreeTerms && (
                <motion.p
                  className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-300"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errors.agreeTerms}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Submit error banner */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              className="mb-4 rounded-2xl border border-red-400/40 bg-red-400/10 p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-200">{submitError}</p>
                  <button
                    type="button"
                    onClick={retryRegistration}
                    disabled={isSubmitting}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-bold text-red-200 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <motion.div
          className="pb-8 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-400/25 disabled:opacity-60"
            whileHover={!isSubmitting ? { scale: 1.02, boxShadow: '0 0 30px rgba(251,191,36,0.4)' } : {}}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="inline-block h-5 w-5 rounded-full border-2 border-slate-900 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                Submitting...
              </span>
            ) : (
              'JOIN NOW'
            )}
          </motion.button>
        </motion.div>

      </form>
    </motion.div>
  );
}