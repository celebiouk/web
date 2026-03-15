// Email Templates Index
// All templates use the consistent cele.bio branding with EmailShell wrapper

// Shell (base layout for all emails)
export { EmailShell } from './EmailShell';

// Onboarding & Auth
export { WelcomeEmail } from './WelcomeEmail';
export { EmailVerification } from './EmailVerification';
export { PasswordReset } from './PasswordReset';

// Products & Sales
export { ProductUploadSuccess } from './ProductUploadSuccess';
export { SaleNotification } from './SaleNotification';
export { OrderReceived } from './OrderReceived';

// Payments
export { PaymentSuccessful } from './PaymentSuccessful';
export { PaymentFailed } from './PaymentFailed';
export { PaymentReceipt } from './PaymentReceipt';

// Subscriptions
export { ProWelcome } from './ProWelcome';
export { ProCancelled } from './ProCancelled';
export { RenewalReminder } from './RenewalReminder';
export { UpgradeNudge } from './UpgradeNudge';

// Bookings
export { BookingConfirmation } from './BookingConfirmation';
export { BookingReminder } from './BookingReminder';
export { BookingCancelled } from './BookingCancelled';

// Courses
export { CourseEnrollment } from './CourseEnrollment';
export { CourseCompletion } from './CourseCompletion';

// Affiliates
export { AffiliateWelcome } from './AffiliateWelcome';
export { AffiliatePayout } from './AffiliatePayout';
