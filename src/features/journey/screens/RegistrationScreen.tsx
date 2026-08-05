import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, radius, shadows, transitions } from '@design-system/index';
import { GlassPanel } from '../components/GlassPanel';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useJourney } from '../JourneyContext';
import type { ParticipantData } from '../types';

interface FieldConfig {
  name: keyof Pick<ParticipantData, 'fullName' | 'company' | 'phone' | 'email'>;
  label: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
}

const FIELDS: FieldConfig[] = [
  {
    name: 'fullName',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    autoComplete: 'name',
  },
  {
    name: 'company',
    label: 'Company',
    placeholder: 'Enter your company name',
    autoComplete: 'organization',
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    placeholder: 'e.g. 08123456789',
    autoComplete: 'tel',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    autoComplete: 'email',
  },
];

const PHONE_REGEX = /^[+]?[\d\s()-]{8,15}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormErrors = Partial<
  Record<keyof Pick<ParticipantData, 'fullName' | 'company' | 'phone' | 'email'>, string>
>;

/**
 * Registration screen for the participant journey.
 * Collects Full Name, Company, Phone, and Email with client-side validation.
 * Reuses the existing registration API via JourneyContext.
 */
export const RegistrationScreen = memo(function RegistrationScreen() {
  const { submitRegistration, isSubmitting, submitError, goTo } = useJourney();

  const [form, setForm] = useState<
    Pick<ParticipantData, 'fullName' | 'company' | 'phone' | 'email'>
  >({
    fullName: '',
    company: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const updateField = useCallback(
    (name: keyof typeof form, value: string) => {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors],
  );

  const validateField = useCallback(
    (name: keyof typeof form, value: string): string | undefined => {
      const trimmed = value.trim();
      if (!trimmed) return 'This field is required.';
      if (name === 'phone' && !PHONE_REGEX.test(trimmed)) {
        return 'Invalid phone number format.';
      }
      if (name === 'email' && !EMAIL_REGEX.test(trimmed)) {
        return 'Invalid email format.';
      }
      return undefined;
    },
    [],
  );

  const handleBlur = useCallback(
    (name: keyof typeof form) => {
      setTouched((prev) => new Set(prev).add(name));
      const err = validateField(name, form[name]);
      setErrors((prev) => ({ ...prev, [name]: err }));
    },
    [form, validateField],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const nextErrors: FormErrors = {};
      (Object.keys(form) as (keyof typeof form)[]).forEach((name) => {
        const err = validateField(name, form[name]);
        if (err) nextErrors[name] = err;
      });
      setErrors(nextErrors);
      setTouched(new Set(Object.keys(form)));

      if (Object.values(nextErrors).some(Boolean)) return;

      const data: ParticipantData = {
        fullName: form.fullName,
        company: form.company,
        phone: form.phone,
        email: form.email,
        department: '',
        employeeId: '',
        agreeTerms: true,
      };

      await submitRegistration(data);
    },
    [form, validateField, submitRegistration],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Content */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <motion.h1
          className="mb-2 text-center text-3xl font-black tracking-tight sm:text-4xl"
          style={{
            backgroundImage: colors.gradient.blueToGold,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.1)}
        >
          Registration
        </motion.h1>

        <motion.p
          className="mb-8 text-center text-sm font-light tracking-widest uppercase"
          style={{ color: colors.text.secondary }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.luxury(0.25)}
        >
          Enter your details to join the draw
        </motion.p>

        <GlassPanel glow="blue" className="w-full p-8" delay={0.3}>
          {isSubmitting ? (
            <LoadingSkeleton lines={4} />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {FIELDS.map((field, i) => {
                const value = form[field.name];
                const error = errors[field.name];
                const showError = touched.has(field.name) && error;

                return (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={transitions.luxury(0.3 + i * 0.08)}
                  >
                    <label
                      className="mb-1.5 block text-xs font-bold tracking-wider uppercase"
                      style={{ color: colors.text.secondary }}
                    >
                      {field.label}
                      <span className="ml-1" style={{ color: colors.gold.DEFAULT }}>
                        *
                      </span>
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={value}
                      onChange={(e) => updateField(field.name, e.target.value)}
                      onBlur={() => handleBlur(field.name)}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      className="w-full rounded-2xl border bg-white/[0.03] px-5 py-4 text-base text-white placeholder-white/20 backdrop-blur-sm transition-all outline-none"
                      style={{
                        borderColor: showError ? 'rgba(248,113,113,0.5)' : colors.glass.lineStrong,
                        borderRadius: radius.md,
                      }}
                    />
                    <AnimatePresence>
                      {showError && (
                        <motion.p
                          className="mt-1.5 text-xs font-medium"
                          style={{ color: colors.status.disconnected }}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Submit error banner */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: 'rgba(248,113,113,0.4)',
                      background: 'rgba(248,113,113,0.1)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: colors.status.disconnected }}
                    >
                      {submitError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="submit"
                className="relative w-full overflow-hidden rounded-2xl py-4 text-lg font-bold"
                style={{
                  background: colors.gradient.blueToGold,
                  color: colors.text.inverse,
                  borderRadius: radius.button,
                  boxShadow: shadows.button.primary,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitions.spring(0.6)}
                whileHover={{ scale: 1.02, boxShadow: shadows.button.primaryHover }}
                whileTap={{ scale: 0.98 }}
              >
                Submit
              </motion.button>

              {/* Back button */}
              <motion.button
                type="button"
                onClick={() => goTo('scan')}
                className="w-full rounded-2xl border py-3 text-sm font-bold"
                style={{
                  borderColor: colors.glass.lineStrong,
                  color: colors.text.secondary,
                  borderRadius: radius.button,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transitions.luxury(0.7)}
                whileHover={{ background: colors.glass.light }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
            </form>
          )}
        </GlassPanel>
      </div>
    </div>
  );
});
