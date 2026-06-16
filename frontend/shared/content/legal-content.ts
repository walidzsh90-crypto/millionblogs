export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalPageContent = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const privacyEn: LegalPageContent = {
  title: "Privacy Policy",
  description: "Learn how MillionBlogs collects, uses, and protects your personal data.",
  lastUpdated: "June 1, 2026",
  sections: [
    {
      heading: "Information We Collect",
      body: "We collect information you provide when creating an account: name, email address, and password. When you register a blog, we collect your blog URL, RSS feed URL, and verification metadata. Payment information is processed by Stripe and is not stored on our servers.",
    },
    {
      heading: "How We Use Your Information",
      body: "Your information is used to operate and maintain your account, process blog registrations and verifications, provide wallet credits and promotion features, send transactional emails (verification, payment receipts, support tickets), and improve our platform. We do not sell your personal information to third parties.",
    },
    {
      heading: "Data Storage and Security",
      body: "Your data is stored securely on encrypted servers. We implement industry-standard security measures including encryption at rest and in transit, regular security audits, and access controls. You are responsible for maintaining the confidentiality of your account credentials.",
    },
    {
      heading: "Cookies and Tracking",
      body: "We use essential cookies for authentication and session management. Optional analytics cookies help us understand platform usage. You can manage cookie preferences in your browser settings. See our Cookie Policy for detailed information.",
    },
    {
      heading: "Third-Party Services",
      body: "We use Stripe for payment processing. Stripe's privacy policy applies to payment data you submit during checkout. We use analytics services to understand platform usage patterns. These services may collect anonymized usage data.",
    },
    {
      heading: "Your Rights",
      body: "You have the right to access, correct, or delete your personal data. You can export your data from account settings. To delete your account, contact support. Data deletion requests are processed within 30 days. Some data may be retained as required by law.",
    },
    {
      heading: "Data Retention",
      body: "We retain your account data for as long as your account is active. Account deletion requests trigger permanent deletion of personal data within 30 days, except where legal obligations require longer retention. Payment records are retained for tax compliance purposes.",
    },
    {
      heading: "International Transfers",
      body: "Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place through standard contractual clauses and data processing agreements with our service providers.",
    },
    {
      heading: "Changes to This Policy",
      body: "We may update this Privacy Policy from time to time. Material changes will be notified via email or platform notice. Continued use of the platform after changes constitutes acceptance of the updated policy.",
    },
    {
      heading: "Contact Us",
      body: 'For privacy-related inquiries, contact us at privacy@millionblogs.com. You may also submit a support ticket from your dashboard.',
    },
  ],
};

const privacyAr: LegalPageContent = {
  title: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629",
  description: "\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0643\u064A\u0641\u064A\u0629 \u062C\u0645\u0639 \u0648\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0648\u062D\u0645\u0627\u064A\u0629 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0639\u0644\u0649 MillionBlogs.",
  lastUpdated: "1 \u064A\u0648\u0646\u064A\u0648 2026",
  sections: [
    {
      heading: "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u064A \u0646\u062C\u0645\u0639\u0647\u0627",
      body: "\u0646\u062C\u0645\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u0642\u062F\u0645\u0647\u0627 \u0639\u0646\u062F \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628: \u0627\u0644\u0627\u0633\u0645 \u0648\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631. \u0639\u0646\u062F \u062A\u0633\u062C\u064A\u0644 \u0645\u062F\u0648\u0646\u0629\u060C \u0646\u062C\u0645\u0639 \u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062F\u0648\u0646\u0629 \u0648\u0631\u0627\u0628\u0637 RSS \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642. \u062A\u0645 \u0645\u0639\u0627\u0644\u062C\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062F\u0641\u0639 \u0639\u0628\u0631 Stripe \u0648\u0644\u0627 \u0646\u0642\u0648\u0645 \u0628\u062A\u062E\u0632\u064A\u0646\u0647\u0627 \u0639\u0644\u0649 \u062E\u0648\u0627\u062F\u0645\u0646\u0627.",
    },
    {
      heading: "\u0643\u064A\u0641 \u0646\u0633\u062A\u062E\u062F\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643",
      body: "\u062A\u0633\u062A\u062E\u062F\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643 \u0644\u062A\u0634\u063A\u064A\u0644 \u0648\u0635\u064A\u0627\u0646\u0629 \u062D\u0633\u0627\u0628\u0643\u060C \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0645\u062F\u0648\u0646\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0642\u0642\u060C \u0648\u062A\u0648\u0641\u064A\u0631 \u0631\u0635\u064A\u062F \u0648\u0627\u0644\u062A\u0631\u0648\u064A\u062C\u060C \u0648\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F\u0627\u062A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629 \u0627\u0644\u062A\u0639\u0627\u0645\u0644\u064A\u0629\u060C \u0648\u062A\u062D\u0633\u064A\u0646 \u0645\u0646\u0635\u062A\u0646\u0627. \u0644\u0627 \u0646\u0628\u064A\u0639 \u0645\u0639\u0644\u0648\u0645\u0627\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0644\u0623\u0637\u0631\u0627\u0641 \u062B\u0627\u0644\u062B\u0629.",
    },
    {
      heading: "\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u0645\u0627\u0646",
      body: "\u062A\u062A\u0645 \u062A\u062E\u0632\u064A\u0646 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0628\u0634\u0643\u0644 \u0622\u0645\u0646 \u0639\u0644\u0649 \u062E\u0648\u0627\u062F\u0645 \u0645\u0634\u0641\u0631\u0629. \u0646\u0637\u0628\u0642 \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0623\u0645\u0627\u0646\u064A\u0629 \u0642\u064A\u0627\u0633\u064A\u0629 \u0628\u0645\u0627 \u0641\u064A \u0630\u0644\u0643 \u0627\u0644\u062A\u0634\u0641\u064A\u0631 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0631\u0627\u062D\u0629 \u0648\u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0646\u0642\u0644 \u0648\u062A\u062F\u0642\u064A\u0642\u0627\u062A \u0623\u0645\u0646\u064A\u0629 \u0645\u0646\u062A\u0638\u0645\u0629 \u0648\u0636\u0648\u0627\u0628\u0637 \u0627\u0644\u0648\u0635\u0648\u0644. \u0623\u0646\u062A \u0645\u0633\u0624\u0648\u0644 \u0639\u0646 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0633\u0631\u064A\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u062E\u0627\u0635\u062A\u0643.",
    },
    {
      heading: "\u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0648\u0627\u0644\u062A\u062A\u0628\u0639",
      body: "\u0646\u0633\u062A\u062E\u062F\u0645 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A. \u062A\u0633\u0627\u0639\u062F\u0646\u0627 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u064A\u0629 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u064A\u0629 \u0641\u064A \u0641\u0647\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0646\u0635\u0629. \u064A\u0645\u0643\u0646\u0643 \u0625\u062F\u0627\u0631\u0629 \u062A\u0641\u0636\u064A\u0644\u0627\u062A \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u062E\u0627\u0635 \u0628\u0643.",
    },
    {
      heading: "\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u062B\u0627\u0644\u062B",
      body: "\u0646\u0633\u062A\u062E\u062F\u0645 Stripe \u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u062F\u0641\u0639. \u062A\u0646\u0637\u0628\u0642 \u0633\u064A\u0627\u0633\u0629 \u062E\u0635\u0648\u0635\u064A\u0629 Stripe \u0639\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u062A\u064A \u062A\u0642\u062F\u0645\u0647\u0627 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062F\u0641\u0639. \u0646\u0633\u062A\u062E\u062F\u0645 \u062E\u062F\u0645\u0627\u062A \u062A\u062D\u0644\u064A\u0644\u064A\u0629 \u0644\u0641\u0647\u0645 \u0623\u0646\u0645\u0627\u0637 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0646\u0635\u0629.",
    },
    {
      heading: "\u062D\u0642\u0648\u0642\u0643",
      body: "\u0644\u062F\u064A\u0643 \u0627\u0644\u062D\u0642 \u0641\u064A \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0623\u0648 \u062A\u0635\u062D\u064A\u062D\u0647\u0627 \u0623\u0648 \u062D\u0630\u0641\u0647\u0627. \u064A\u0645\u0643\u0646\u0643 \u062A\u0635\u062F\u064A\u0631 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0645\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628. \u0644\u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643\u060C \u0627\u062A\u0635\u0644 \u0628\u0627\u0644\u062F\u0639\u0645. \u062A\u062A\u0645 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628\u0627\u062A \u062D\u0630\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u062E\u0644\u0627\u0644 30 \u064A\u0648\u0645\u064B\u0627.",
    },
    {
      heading: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0646\u0627",
      body: '\u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0639\u0644\u0642\u0629 \u0628\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629\u060C \u0627\u062A\u0635\u0644 \u0628\u0646\u0627 \u0639\u0644\u0649 privacy@millionblogs.com.',
    },
  ],
};

const privacyNl: LegalPageContent = {
  title: "Privacybeleid",
  description: "Lees hoe MillionBlogs uw persoonlijke gegevens verzamelt, gebruikt en beschermt.",
  lastUpdated: "1 juni 2026",
  sections: [
    {
      heading: "Welke Gegevens We Verzamelen",
      body: "We verzamelen gegevens die u verstrekt bij het aanmaken van een account: naam, e-mailadres en wachtwoord. Wanneer u een blog registreert, verzamelen we uw blog-URL, RSS-feed-URL en verificatiemetadata. Betalingsgegevens worden verwerkt door Stripe en niet op onze servers opgeslagen.",
    },
    {
      heading: "Hoe We Uw Gegevens Gebruiken",
      body: "Uw gegevens worden gebruikt om uw account te beheren, blogregistraties en -verificaties te verwerken, wallet-tegoeden en promotiefuncties te bieden, transactie-e-mails te verzenden en ons platform te verbeteren. We verkopen uw persoonlijke gegevens niet aan derden.",
    },
    {
      heading: "Gegevensopslag en Beveiliging",
      body: "Uw gegevens worden veilig opgeslagen op versleutelde servers. We passen industriestandaard beveiligingsmaatregelen toe, waaronder versleuteling in rust en onderweg, regelmatige beveiligingsaudits en toegangscontroles. U bent verantwoordelijk voor het vertrouwelijk houden van uw inloggegevens.",
    },
    {
      heading: "Cookies en Tracking",
      body: "We gebruiken essentiële cookies voor authenticatie en sessiebeheer. Optionele analytische cookies helpen ons platformgebruik te begrijpen. U kunt cookievoorkeuren beheren in uw browserinstellingen. Zie ons Cookiebeleid voor gedetailleerde informatie.",
    },
    {
      heading: "Diensten van Derden",
      body: "We gebruiken Stripe voor betalingsverwerking. Het privacybeleid van Stripe is van toepassing op betalingsgegevens die u verstrekt tijdens het afrekenen. We gebruiken analysediensten om platformgebruikspatronen te begrijpen.",
    },
    {
      heading: "Uw Rechten",
      body: "U heeft het recht om uw persoonlijke gegevens in te zien, te corrigeren of te verwijderen. U kunt uw gegevens exporteren vanuit accountinstellingen. Neem contact op met ondersteuning om uw account te verwijderen. Verzoeken tot gegevensverwijdering worden binnen 30 dagen verwerkt.",
    },
    {
      heading: "Contact",
      body: 'Voor privacygerelateerde vragen kunt u contact met ons opnemen via privacy@millionblogs.com.',
    },
  ],
};

export const privacyContent: Record<string, LegalPageContent> = {
  en: privacyEn,
  ar: privacyAr,
  nl: privacyNl,
};

const termsEn: LegalPageContent = {
  title: "Terms of Service",
  description: "The terms and conditions governing the use of MillionBlogs platform.",
  lastUpdated: "June 1, 2026",
  sections: [
    {
      heading: "Acceptance of Terms",
      body: "By accessing or using MillionBlogs, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. We may update these terms; continued use after changes constitutes acceptance.",
    },
    {
      heading: "Account Registration",
      body: "You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials. You must be at least 13 years of age to use this platform. Accounts found to be in violation may be suspended.",
    },
    {
      heading: "Blog Registration and Verification",
      body: "You may register blogs you own or have authority to manage. Verification of ownership is required via meta tag, DNS record, or file upload. Fraudulent registration may result in account termination. We reserve the right to reject or remove blogs that violate our policies.",
    },
    {
      heading: "Wallet Credits",
      body: "Wallet credits are non-refundable and non-transferable. Credits purchased via Stripe are added to your wallet upon payment confirmation. Credits used for promotions are deducted at the time of campaign activation. Expired or unused credits are not refundable unless required by law.",
    },
    {
      heading: "Promotions and Campaigns",
      body: "Promotion campaigns must comply with all applicable laws and regulations. You may not promote illegal content, hate speech, or misleading material. We reserve the right to cancel campaigns that violate our policies without refund of used credits.",
    },
    {
      heading: "Subscriptions",
      body: "Subscription fees are charged in advance on a monthly or yearly basis as selected. Cancellation takes effect at the end of the current billing period. Refunds are provided only where required by applicable consumer protection laws.",
    },
    {
      heading: "User Conduct",
      body: "You agree not to: misuse the platform for spam or unauthorized advertising; attempt to access other users' accounts; disrupt platform operations; scrape content without permission; or upload malicious code. Violations may result in immediate account termination.",
    },
    {
      heading: "Intellectual Property",
      body: "You retain ownership of content you submit. By submitting content, you grant us a license to display and distribute it on the platform. The MillionBlogs name, logo, and platform design are our intellectual property and may not be used without permission.",
    },
    {
      heading: "Limitation of Liability",
      body: "MillionBlogs is provided 'as is' without warranties of any kind. We are not liable for indirect, incidental, or consequential damages arising from platform use. Our total liability is limited to the amount paid by you in the 12 months preceding the claim.",
    },
    {
      heading: "Termination",
      body: "You may terminate your account at any time from account settings. We may suspend or terminate accounts for violations of these terms. Upon termination, your right to access the platform ceases immediately. Data is handled according to our Privacy Policy.",
    },
    {
      heading: "Governing Law",
      body: "These terms are governed by the laws of the Netherlands. Disputes shall be resolved in the courts of Amsterdam. This does not affect your statutory rights as a consumer under applicable local law.",
    },
    {
      heading: "Contact",
      body: 'For questions about these terms, contact us at legal@millionblogs.com or submit a support ticket from your dashboard.',
    },
  ],
};

const termsAr: LegalPageContent = {
  title: "\u0634\u0631\u0648\u0637 \u0627\u0644\u062E\u062F\u0645\u0629",
  description: "\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645 \u0627\u0644\u062A\u064A \u062A\u062D\u0643\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0646\u0635\u0629 MillionBlogs.",
  lastUpdated: "1 \u064A\u0648\u0646\u064A\u0648 2026",
  sections: [
    {
      heading: "\u0642\u0628\u0648\u0644 \u0627\u0644\u0634\u0631\u0648\u0637",
      body: "\u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 MillionBlogs\u060C \u0623\u0646\u062A \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0634\u0631\u0648\u0637. \u0625\u0630\u0627 \u0644\u0645 \u062A\u0648\u0627\u0641\u0642\u060C \u0644\u0627 \u062A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0646\u0635\u0629. \u0646\u062D\u0646 \u0646\u062D\u062A\u0641\u0638 \u0628\u0627\u0644\u062D\u0642 \u0641\u064A \u062A\u062D\u062F\u064A\u062B \u0647\u0630\u0647 \u0627\u0644\u0634\u0631\u0648\u0637.",
    },
    {
      heading: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628",
      body: "\u064A\u062C\u0628 \u0623\u0646 \u062A\u0642\u062F\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062F\u0642\u064A\u0642\u0629 \u0639\u0646\u062F \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628. \u0623\u0646\u062A \u0645\u0633\u0624\u0648\u0644 \u0639\u0646 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0633\u0631\u064A\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643. \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0639\u0645\u0631\u0643 13 \u0633\u0646\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0647 \u0627\u0644\u0645\u0646\u0635\u0629.",
    },
    {
      heading: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0646\u0627",
      body: '\u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u062D\u0648\u0644 \u0647\u0630\u0647 \u0627\u0644\u0634\u0631\u0648\u0637\u060C \u0627\u062A\u0635\u0644 \u0628\u0646\u0627 \u0639\u0644\u0649 legal@millionblogs.com.',
    },
  ],
};

const termsNl: LegalPageContent = {
  title: "Servicevoorwaarden",
  description: "De voorwaarden die het gebruik van het MillionBlogs-platform beheren.",
  lastUpdated: "1 juni 2026",
  sections: [
    {
      heading: "Aanvaarding van Voorwaarden",
      body: "Door MillionBlogs te gebruiken, gaat u akkoord met deze Servicevoorwaarden. Als u niet akkoord gaat, gebruik het platform dan niet. We kunnen deze voorwaarden bijwerken; voortgezet gebruik na wijzigingen betekent aanvaarding.",
    },
    {
      heading: "Accountregistratie",
      body: "U moet nauwkeurige informatie verstrekken bij het aanmaken van een account. U bent verantwoordelijk voor het vertrouwelijk houden van uw inloggegevens. U moet minimaal 13 jaar oud zijn om dit platform te gebruiken.",
    },
    {
      heading: "Contact",
      body: 'Voor vragen over deze voorwaarden kunt u contact met ons opnemen via legal@millionblogs.com.',
    },
  ],
};

export const termsContent: Record<string, LegalPageContent> = {
  en: termsEn,
  ar: termsAr,
  nl: termsNl,
};

const cookiesEn: LegalPageContent = {
  title: "Cookie Policy",
  description: "How MillionBlogs uses cookies and similar tracking technologies.",
  lastUpdated: "June 1, 2026",
  sections: [
    {
      heading: "What Are Cookies",
      body: "Cookies are small text files stored on your device by your web browser. They help websites remember your preferences, authenticate your session, and understand how the site is used. Similar technologies include local storage and session storage.",
    },
    {
      heading: "Essential Cookies",
      body: "These cookies are necessary for the platform to function. They enable authentication (keeping you logged in), session management, and security features. Essential cookies cannot be disabled. They do not store personally identifiable information beyond your session.",
    },
    {
      heading: "Analytics Cookies",
      body: "We use analytics cookies to understand how visitors interact with the platform. This helps us improve our service. These cookies collect anonymized data about page visits, navigation paths, and feature usage. No personally identifiable information is collected.",
    },
    {
      heading: "Third-Party Cookies",
      body: "Stripe sets cookies during the checkout process for payment processing and fraud prevention. These cookies are controlled by Stripe and are subject to Stripe's privacy policy. We do not control or access Stripe's cookies.",
    },
    {
      heading: "Managing Cookies",
      body: "Most web browsers allow you to control cookies through their settings. You can block or delete cookies, but this may affect platform functionality. Essential cookies cannot be rejected as they are required for platform operation.",
    },
    {
      heading: "Changes to This Policy",
      body: "We may update this Cookie Policy as our use of cookies evolves. Material changes will be communicated via platform notice. The latest version is always available on this page.",
    },
    {
      heading: "Contact",
      body: 'For questions about our use of cookies, contact us at privacy@millionblogs.com.',
    },
  ],
};

const cookiesAr: LegalPageContent = {
  title: "\u0633\u064A\u0627\u0633\u0629 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637",
  description: "\u0643\u064A\u0641 \u064A\u0633\u062A\u062E\u062F\u0645 MillionBlogs \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0648\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0645\u0627\u062B\u0644\u0629.",
  lastUpdated: "1 \u064A\u0648\u0646\u064A\u0648 2026",
  sections: [
    {
      heading: "\u0645\u0627 \u0647\u064A \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637",
      body: "\u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0647\u064A \u0645\u0644\u0641\u0627\u062A \u0646\u0635\u064A\u0629 \u0635\u063A\u064A\u0631\u0629 \u062A\u062E\u0632\u0646\u0647\u0627 \u0645\u062A\u0635\u0641\u062D\u0627\u062A \u0627\u0644\u0648\u064A\u0628 \u0639\u0644\u0649 \u062C\u0647\u0627\u0632\u0643. \u0647\u064A \u062A\u0633\u0627\u0639\u062F \u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0648\u064A\u0628 \u0639\u0644\u0649 \u062A\u0630\u0643\u0631 \u062A\u0641\u0636\u064A\u0644\u0627\u062A\u0643 \u0648\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u062A\u0643 \u0648\u0641\u0647\u0645 \u0643\u064A\u0641\u064A\u0629 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0648\u0642\u0639.",
    },
    {
      heading: "\u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
      body: "\u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0636\u0631\u0648\u0631\u064A\u0629 \u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0646\u0635\u0629. \u0647\u064A \u062A\u0645\u0643\u0646 \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0648\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0648\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0623\u0645\u0627\u0646. \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u0637\u064A\u0644 \u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.",
    },
    {
      heading: "\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0646\u0627",
      body: '\u0644\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u062D\u0648\u0644 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0646\u0627 \u0644\u0645\u0644\u0641\u0627\u062A \u062A\u0639\u0631\u064A\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637\u060C \u0627\u062A\u0635\u0644 \u0628\u0646\u0627 \u0639\u0644\u0649 privacy@millionblogs.com.',
    },
  ],
};

const cookiesNl: LegalPageContent = {
  title: "Cookiebeleid",
  description: "Hoe MillionBlogs cookies en vergelijkbare trackingtechnologieën gebruikt.",
  lastUpdated: "1 juni 2026",
  sections: [
    {
      heading: "Wat Zijn Cookies",
      body: "Cookies zijn kleine tekstbestanden die door uw webbrowser op uw apparaat worden opgeslagen. Ze helpen websites uw voorkeuren te onthouden, uw sessie te authenticeren en te begrijpen hoe de site wordt gebruikt.",
    },
    {
      heading: "Essentiële Cookies",
      body: "Deze cookies zijn noodzakelijk voor de werking van het platform. Ze maken authenticatie, sessiebeheer en beveiligingsfuncties mogelijk. Essentiële cookies kunnen niet worden uitgeschakeld.",
    },
    {
      heading: "Contact",
      body: 'Voor vragen over ons gebruik van cookies kunt u contact met ons opnemen via privacy@millionblogs.com.',
    },
  ],
};

export const cookiesContent: Record<string, LegalPageContent> = {
  en: cookiesEn,
  ar: cookiesAr,
  nl: cookiesNl,
};
