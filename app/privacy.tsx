import { LegalDocument } from '@/components/legal/LegalDocument';

const EFFECTIVE = 'July 22, 2026';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocument
      title="Privacy Policy"
      effectiveDate={EFFECTIVE}
      intro="This Privacy Policy explains how Dosify (“we”, “us”, or “our”) collects, uses, stores, and shares information when you use the Dosify mobile and web applications and related services (the “Service”)."
      sections={[
        {
          heading: '1. Who we are',
          paragraphs: [
            'Dosify is a personal health and medication companion that helps you track medicines and supplements, schedule doses, review possible interactions, and optionally sync limited wearable data. Contact: support@mydosify.com.',
          ],
        },
        {
          heading: '2. Information we collect',
          paragraphs: [
            'Depending on how you use Dosify, we may collect:',
          ],
          bullets: [
            'Account information: name, email address, and authentication credentials.',
            'Health profile information you provide: age, weight, height, gender, conditions, allergies, emergency contacts, and related notes.',
            'Medication and adherence data: Health Cabinet items, schedules, dose events (taken, skipped, snoozed, missed), symptoms, and interaction checks.',
            'Wearable / Apple Health data you authorize: such as heart rate, sleep, steps, and activity summaries used for recovery and observational insights.',
            'Usage and device data: app interactions, approximate diagnostics, and technical logs needed to operate and secure the Service.',
            'Support communications: messages you send to support@mydosify.com.',
          ],
        },
        {
          heading: '3. How we use information',
          paragraphs: [
            'We use information to:',
          ],
          bullets: [
            'Provide core features: accounts, cabinet, schedules, reminders, interaction checks, reports, and family/caregiver sharing you enable.',
            'Personalize safety context (for example, using allergies or conditions you enter when running a check).',
            'Generate informational insights and summaries, including optional AI-assisted plain-language explanations.',
            'Maintain security, prevent abuse, troubleshoot issues, and improve the Service.',
            'Comply with law and respond to lawful requests.',
          ],
        },
        {
          heading: '4. Health data and sensitive information',
          paragraphs: [
            'Dosify is designed for personal wellness and medication organization. Content you enter about medicines, symptoms, conditions, or wearables may be sensitive health-related information. We process that data to provide the features you request.',
            'Dosify does not provide medical diagnosis, treatment, or emergency services. Interaction results and insights are informational only and are not a substitute for professional medical advice.',
          ],
        },
        {
          heading: '5. Apple Health / HealthKit',
          paragraphs: [
            'If you enable Apple Watch / Apple Health sync on iOS, Dosify reads only the HealthKit data types you authorize (such as heart rate, sleep, steps, and activity). We use that data to power recovery and observational insights inside Dosify.',
            'We do not sell HealthKit data. We do not use HealthKit data for advertising or for data brokers. You can revoke Health access anytime in iOS Settings → Privacy & Security → Health → Dosify.',
          ],
        },
        {
          heading: '6. AI processing',
          paragraphs: [
            'Some features may send limited context (for example, substance names or check findings) to third-party AI providers to generate plain-language explanations. Deterministic safety rules assign risk levels; AI may rephrase language but should not change those risk determinations. Do not enter information in free-text fields that you do not want processed for these features.',
          ],
        },
        {
          heading: '7. Sharing and caregivers',
          paragraphs: [
            'We do not sell your personal information.',
            'We may share information with service providers who help us host, authenticate, analyze, or operate the Service (for example, cloud hosting and AI providers), under contractual obligations to protect data.',
            'If you use Family & Care features, you may grant another Dosify user limited access (such as emergency card or reports). You can revoke grants in the app. Shared access is logged where feasible.',
            'We may disclose information if required by law, to protect rights and safety, or in connection with a merger, acquisition, or asset transfer, subject to applicable protections.',
          ],
        },
        {
          heading: '8. Retention',
          paragraphs: [
            'We retain account and health data while your account is active and as needed to provide the Service. We may retain limited records for security, dispute resolution, and legal compliance. You may request deletion as described below.',
          ],
        },
        {
          heading: '9. Security',
          paragraphs: [
            'We use industry-standard safeguards appropriate to the nature of the data, including encrypted transport (HTTPS) and access controls on our systems. No method of transmission or storage is 100% secure.',
          ],
        },
        {
          heading: '10. Your choices and account deletion',
          paragraphs: [
            'You can update profile information in the app. You can disable HealthKit permissions in iOS Settings. You can revoke caregiver grants in Family & Care.',
            'To delete your Dosify account and associated personal data, email support@mydosify.com from the email address on your account with the subject “Account deletion request”. We will verify ownership and delete or anonymize account data within a reasonable period, except where we must retain limited information for legal or security reasons.',
            'After deletion, some backups may persist for a limited time before being purged according to our backup cycles.',
          ],
        },
        {
          heading: '11. Children',
          paragraphs: [
            'Dosify is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has created an account, contact us and we will take appropriate steps.',
          ],
        },
        {
          heading: '12. International users',
          paragraphs: [
            'The Service may be hosted or processed in countries other than where you live. By using Dosify, you understand that your information may be transferred to and processed in those locations, subject to this Policy and applicable law.',
          ],
        },
        {
          heading: '13. Changes',
          paragraphs: [
            'We may update this Privacy Policy from time to time. We will post the updated version with a revised effective date. Continued use of the Service after changes means you accept the updated Policy.',
          ],
        },
        {
          heading: '14. Contact',
          paragraphs: [
            'Questions about privacy: support@mydosify.com',
            'Web: https://mydosify.com/privacy',
          ],
        },
      ]}
      footerNote="This policy is provided for transparency and App Store / web compliance. It is not legal advice. Have counsel review before relying on it for regulated markets."
    />
  );
}
