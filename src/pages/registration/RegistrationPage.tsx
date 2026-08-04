import { AnimatePresence } from 'framer-motion';
import { RegistrationProvider, useRegistration } from '../../components/registration/RegistrationContext';
import { SplashScreen } from '../../components/registration/SplashScreen';
import { WelcomeScreen } from '../../components/registration/WelcomeScreen';
import { RegistrationForm } from '../../components/registration/RegistrationForm';
import { ConfirmationScreen } from '../../components/registration/ConfirmationScreen';
import { WaitingScreen } from '../../components/registration/WaitingScreen';

function RegistrationFlow() {
  const { step } = useRegistration();

  return (
    <div className="min-h-screen bg-[#020617]">
      <AnimatePresence mode="wait">
        {step === 'splash' && <SplashScreen key="splash" />}
        {step === 'welcome' && <WelcomeScreen key="welcome" />}
        {step === 'form' && <RegistrationForm key="form" />}
        {step === 'confirmation' && <ConfirmationScreen key="confirmation" />}
        {step === 'waiting' && <WaitingScreen key="waiting" />}
      </AnimatePresence>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <RegistrationProvider>
      <RegistrationFlow />
    </RegistrationProvider>
  );
}