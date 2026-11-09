export const TYPES = {
  pay: { label: 'Payment apps', color: '#2a78d6', blurb: 'UPI transfers, payments and bills.' },
  rewards: { label: 'Cards & rewards', color: '#eb6834', blurb: 'Card management, card products or payment rewards.' },
  lending: { label: 'Loans & credit', color: '#1baf7a', blurb: 'Products that facilitate borrowing or instalments.' },
  bigtech: { label: 'Commerce & platforms', color: '#b57800', blurb: 'Payments within shopping, messaging or device platforms.' },
  prepaid: { label: 'Accounts & prepaid', color: '#ba4a80', blurb: 'Wallets, prepaid instruments and account-management products.' },
  wealth: { label: 'Investing & savings', color: '#008300', blurb: 'Investment and savings products.' },
  agent: { label: 'Merchants & agents', color: '#6250d6', blurb: 'Retail acceptance, merchant tools and assisted financial services.' },
  bank: { label: 'Bank apps', color: '#e34948', blurb: 'Bank rows in the supplied table. Individual apps can have different eligibility rules.' },
  services: { label: 'Finance platforms', color: '#647448', blurb: 'Apps combining several financial services, each with its own product requirements.' },
  unknown: { label: 'Type unverified', color: '#6f7799', blurb: 'The available primary evidence does not establish a reliable product match.' },
};
export const BANK_SUBS = { psb: 'Public sector bank', pvt: 'Private sector bank', foreign: 'Foreign bank', sfb: 'Small finance bank', pb: 'Payments bank' };
export const DEMOGRAPHIC_DIMENSIONS = { age: 'Age', gender: 'Gender', location: 'Location', employment: 'Employment', user_type: 'User type' };
export const PROFILE_DIMENSIONS = { age: 'Age', location: 'Location', employment: 'Work & life stage', income: 'Income & spending', gender: 'Gender' };
export const DEMOGRAPHIC_GROUPS = {
  'Age': { teens: 'Under 18', gen_z: '18–25', young_adults: '25–35', older_adults: '35+' },
  'Location': { metro: 'Metros & tier 1', tier2_3: 'Tier 2–3 towns', rural: 'Rural' },
  'Work & life stage': { students: 'Students', salaried: 'Salaried', self_employed: 'Self-employed', gig_workers: 'Gig workers', merchants: 'Shop owners' },
  'Income & spending': { low_income: 'Low income / new to credit', middle_income: 'Middle income', affluent: 'Affluent / high spenders' },
  'Gender': { women: 'Women' },
  'Needs': { borrowers: 'Borrowers', investors: 'Investors & savers', card_holders: 'Credit card holders', businesses: 'Businesses' },
};
export const DEMOGRAPHIC_FILTERS = Object.assign({}, ...Object.values(DEMOGRAPHIC_GROUPS));
export const GATES = {
  upi: 'Bank account / linked mobile', bank: 'Account with this bank', card: 'Existing card', credit: 'Credit assessment',
  kyc: 'Identity verification / KYC', parent: 'Guardian permission for minors', employer: 'Employer programme',
  agent: 'Merchant / agent registration', device: 'Compatible device', deposit: 'Fixed-deposit collateral',
};
