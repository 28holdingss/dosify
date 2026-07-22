import { LegalDocument } from '@/components/legal/LegalDocument';

const EFFECTIVE = 'July 22, 2026';

export default function TermsOfUseScreen() {
  return (
    <LegalDocument
      title="Terms of Use"
      effectiveDate={EFFECTIVE}
      intro="These Terms of Use (“Terms”) govern your access to and use of Dosify’s mobile and web applications and related services (the “Service”). By creating an account or using Dosify, you agree to these Terms."
      sections={[
        {
          heading: '1. The Service',
          paragraphs: [
            'Dosify helps you organize medicines and supplements, schedule doses, log symptoms, run informational interaction checks, export reports, and optionally sync wearable data. Features may change over time.',
          ],
        },
        {
          heading: '2. Not medical advice',
          paragraphs: [
            'Dosify is for personal organization and informational purposes only. It does not provide medical advice, diagnosis, or treatment. Interaction checks, AI summaries, and insights do not mean a combination is “safe,” and missing findings do not mean there is no risk.',
            'Always consult a qualified clinician or pharmacist before starting, stopping, or combining medicines, supplements, alcohol, or other substances. In an emergency, call your local emergency number immediately.',
          ],
        },
        {
          heading: '3. Eligibility and accounts',
          paragraphs: [
            'You must be at least 13 years old (or the age of digital consent in your region) to use Dosify. You are responsible for your account credentials and for activity under your account. Provide accurate information and keep it updated.',
          ],
        },
        {
          heading: '4. Acceptable use',
          paragraphs: [
            'You agree not to:',
          ],
          bullets: [
            'Use the Service for unlawful purposes or to harm others.',
            'Attempt to access another user’s data without a valid care grant or authorization.',
            'Interfere with or disrupt the Service, reverse engineer it except where allowed by law, or misuse APIs.',
            'Upload content that infringes rights or contains malware.',
            'Misrepresent Dosify outputs as clinical advice or professional medical judgment.',
          ],
        },
        {
          heading: '5. Your content',
          paragraphs: [
            'You retain ownership of the information you enter (such as cabinet items, notes, and symptoms). You grant us a limited license to host, process, and display that content solely to operate and improve the Service as described in our Privacy Policy.',
          ],
        },
        {
          heading: '6. Family and caregiver features',
          paragraphs: [
            'If you invite others or accept an invite, you are responsible for granting only appropriate access and for complying with applicable privacy laws when sharing another person’s health information. Grants are revocable in the app.',
          ],
        },
        {
          heading: '7. Premium and paid features',
          paragraphs: [
            'Some features may require a paid or premium entitlement. Pricing, billing, and cancellation for App Store purchases are handled by Apple according to their terms. We may change premium features with notice where required.',
          ],
        },
        {
          heading: '8. Third-party services',
          paragraphs: [
            'The Service may rely on third parties (hosting, authentication, AI providers, Apple Health). Their terms and privacy practices apply to their services. We are not responsible for third-party outages or policy changes outside our control.',
          ],
        },
        {
          heading: '9. Disclaimers',
          paragraphs: [
            'THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT RESULTS WILL BE ACCURATE, COMPLETE, OR ERROR-FREE.',
          ],
        },
        {
          heading: '10. Limitation of liability',
          paragraphs: [
            'TO THE MAXIMUM EXTENT PERMITTED BY LAW, DOSIFY AND ITS OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, PROFITS, OR HEALTH OUTCOMES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE CLAIM OR (B) USD $50.',
            'Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted.',
          ],
        },
        {
          heading: '11. Termination',
          paragraphs: [
            'You may stop using Dosify at any time and request account deletion as described in the Privacy Policy. We may suspend or terminate access if you violate these Terms or if we discontinue the Service.',
          ],
        },
        {
          heading: '12. Changes',
          paragraphs: [
            'We may update these Terms by posting a revised version with a new effective date. Continued use after changes constitutes acceptance, except where additional consent is required by law.',
          ],
        },
        {
          heading: '13. Contact',
          paragraphs: [
            'Questions about these Terms: support@mydosify.com',
            'Web: https://mydosify.com/terms',
          ],
        },
      ]}
      footerNote="These Terms are a starting template for App Store / web compliance and should be reviewed by counsel for your entity and jurisdictions."
    />
  );
}
